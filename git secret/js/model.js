/**
 * model.js — TensorFlow.js ML Pipeline
 * Classification (Grade A/B/C/D/F) + Regression (GPA 0.0–4.0)
 */

const MLModel = (() => {
  'use strict';

  let classModel = null;
  let regModel   = null;
  let isTrainingClass = false;
  let isTrainingReg   = false;

  // ── Build Classification Model ──────────────────────────────
  function buildClassificationModel(numFeatures, numClasses) {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [numFeatures],
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    model.add(tf.layers.dense({
      units: numClasses,
      activation: 'softmax',
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  // ── Build Regression Model ───────────────────────────────────
  function buildRegressionModel(numFeatures) {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [numFeatures],
      units: 128,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.25 }));

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.15 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));

    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid', // output in [0,1] → multiply by 4 for GPA
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return model;
  }

  // ── Train Classification ─────────────────────────────────────
  async function trainClassification({ epochs = 50, batchSize = 32, onEpochEnd, onTrainBegin, onTrainEnd }) {
    if (isTrainingClass) return;
    isTrainingClass = true;

    const { xs, ys, numFeatures, numClasses } = DataModule.prepareClassificationData();
    const dataset = DataModule.getDataset();

    // Split 80/20 train/test
    const splitIdx  = Math.floor(xs.length * 0.8);
    const xTrain    = xs.slice(0, splitIdx);
    const yTrain    = ys.slice(0, splitIdx);
    const xTest     = xs.slice(splitIdx);
    const yTest     = ys.slice(splitIdx);
    const testData  = dataset.slice(splitIdx);

    const xTrainT = tf.tensor2d(xTrain, [xTrain.length, numFeatures]);
    const yTrainT = tf.tensor1d(yTrain, 'int32');
    const xTestT  = tf.tensor2d(xTest,  [xTest.length,  numFeatures]);
    const yTestT  = tf.tensor1d(yTest,  'int32');

    // Dispose old model
    if (classModel) { classModel.dispose(); }
    classModel = buildClassificationModel(numFeatures, numClasses);

    if (onTrainBegin) onTrainBegin();

    const history = { loss: [], valLoss: [], accuracy: [], valAccuracy: [] };

    await classModel.fit(xTrainT, yTrainT, {
      epochs,
      batchSize,
      validationData: [xTestT, yTestT],
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          history.loss.push(parseFloat(logs.loss.toFixed(4)));
          history.valLoss.push(parseFloat(logs.val_loss.toFixed(4)));
          history.accuracy.push(parseFloat((logs.acc || logs.accuracy || 0).toFixed(4)));
          history.valAccuracy.push(parseFloat((logs.val_acc || logs.val_accuracy || 0).toFixed(4)));
          if (onEpochEnd) await onEpochEnd(epoch + 1, logs, history);
        },
      },
    });

    // Confusion matrix on test set
    const predTensor = classModel.predict(xTestT);
    const predIdx    = Array.from(tf.argMax(predTensor, 1).dataSync());
    const trueIdx    = yTest;
    const cm         = buildConfusionMatrix(trueIdx, predIdx, numClasses);

    // Per-class accuracy
    const classAccuracy = computePerClassAccuracy(cm, numClasses);

    // Cleanup tensors
    xTrainT.dispose(); yTrainT.dispose();
    xTestT.dispose();  yTestT.dispose();
    predTensor.dispose();

    isTrainingClass = false;

    const finalAcc = history.valAccuracy[history.valAccuracy.length - 1];

    if (onTrainEnd) onTrainEnd({ history, cm, classAccuracy, finalAcc });
    return { history, cm, classAccuracy, finalAcc };
  }

  // ── Train Regression ─────────────────────────────────────────
  async function trainRegression({ epochs = 60, batchSize = 32, onEpochEnd, onTrainBegin, onTrainEnd }) {
    if (isTrainingReg) return;
    isTrainingReg = true;

    const { xs, ys, numFeatures } = DataModule.prepareRegressionData();

    const splitIdx = Math.floor(xs.length * 0.8);
    const xTrain   = xs.slice(0, splitIdx);
    const yTrain   = ys.slice(0, splitIdx);
    const xTest    = xs.slice(splitIdx);
    const yTest    = ys.slice(splitIdx);

    const xTrainT = tf.tensor2d(xTrain, [xTrain.length, numFeatures]);
    const yTrainT = tf.tensor2d(yTrain, [yTrain.length, 1]);
    const xTestT  = tf.tensor2d(xTest,  [xTest.length,  numFeatures]);
    const yTestT  = tf.tensor2d(yTest,  [yTest.length,  1]);

    if (regModel) { regModel.dispose(); }
    regModel = buildRegressionModel(numFeatures);

    if (onTrainBegin) onTrainBegin();

    const history = { loss: [], valLoss: [], mae: [], valMae: [] };

    await regModel.fit(xTrainT, yTrainT, {
      epochs,
      batchSize,
      validationData: [xTestT, yTestT],
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          history.loss.push(parseFloat(logs.loss.toFixed(5)));
          history.valLoss.push(parseFloat(logs.val_loss.toFixed(5)));
          history.mae.push(parseFloat((logs.mae || logs.mean_absolute_error || 0).toFixed(5)));
          history.valMae.push(parseFloat((logs.val_mae || logs.val_mean_absolute_error || 0).toFixed(5)));
          if (onEpochEnd) await onEpochEnd(epoch + 1, logs, history);
        },
      },
    });

    // Evaluation metrics on test set
    const predTensor = regModel.predict(xTestT);
    const predVals   = Array.from(predTensor.dataSync()).map(v => v * 4); // scale back to GPA
    const trueVals   = yTest.map(v => v * 4);

    const mae  = computeMAE(trueVals, predVals);
    const rmse = computeRMSE(trueVals, predVals);
    const r2   = computeR2(trueVals, predVals);

    xTrainT.dispose(); yTrainT.dispose();
    xTestT.dispose();  yTestT.dispose();
    predTensor.dispose();

    isTrainingReg = false;

    const finalLoss = history.valLoss[history.valLoss.length - 1];

    if (onTrainEnd) onTrainEnd({ history, mae, rmse, r2, finalLoss });
    return { history, mae, rmse, r2, finalLoss };
  }

  // ── Predict (single student) ─────────────────────────────────
  async function predict(rawInput) {
    const featureVec = DataModule.prepareStudentInput(rawInput);
    const inputTensor = tf.tensor2d([featureVec]);

    const results = {};

    // Classification
    if (classModel) {
      const classPred   = classModel.predict(inputTensor);
      const probs       = Array.from(classPred.dataSync());
      const gradeIdx    = probs.indexOf(Math.max(...probs));
      results.grade     = DataModule.GRADE_LABELS[gradeIdx];
      results.gradeProbs = probs;
      results.confidence = probs[gradeIdx];
      classPred.dispose();
    }

    // Regression
    if (regModel) {
      const regPred    = regModel.predict(inputTensor);
      const rawGPA     = Array.from(regPred.dataSync())[0];
      results.gpa      = parseFloat((rawGPA * 4).toFixed(2));
      results.passFail = DataModule.gpaToPassFail(results.gpa);
      regPred.dispose();
    }

    // If only one model trained, derive the other
    if (!results.grade && results.gpa !== undefined) {
      results.grade = DataModule.gpaToGrade(results.gpa);
    }
    if (results.gpa === undefined && results.grade) {
      const gpaMap = { A: 3.85, B: 3.25, C: 2.5, D: 1.5, F: 0.8 };
      results.gpa = gpaMap[results.grade];
      results.passFail = DataModule.gpaToPassFail(results.gpa);
    }

    inputTensor.dispose();
    return results;
  }

  // ── Confusion Matrix ─────────────────────────────────────────
  function buildConfusionMatrix(trueLabels, predLabels, numClasses) {
    const cm = Array.from({ length: numClasses }, () => new Array(numClasses).fill(0));
    for (let i = 0; i < trueLabels.length; i++) {
      const t = trueLabels[i];
      const p = predLabels[i];
      if (t >= 0 && t < numClasses && p >= 0 && p < numClasses) {
        cm[t][p]++;
      }
    }
    return cm;
  }

  function computePerClassAccuracy(cm, numClasses) {
    return Array.from({ length: numClasses }, (_, i) => {
      const total = cm[i].reduce((a, b) => a + b, 0);
      return total === 0 ? 0 : parseFloat((cm[i][i] / total).toFixed(3));
    });
  }

  // ── Regression Metrics ───────────────────────────────────────
  function computeMAE(truth, pred) {
    const n = truth.length;
    return parseFloat((truth.reduce((s, t, i) => s + Math.abs(t - pred[i]), 0) / n).toFixed(4));
  }

  function computeRMSE(truth, pred) {
    const n = truth.length;
    const mse = truth.reduce((s, t, i) => s + (t - pred[i]) ** 2, 0) / n;
    return parseFloat(Math.sqrt(mse).toFixed(4));
  }

  function computeR2(truth, pred) {
    const n    = truth.length;
    const mean = truth.reduce((a, b) => a + b, 0) / n;
    const ssTot = truth.reduce((s, t) => s + (t - mean) ** 2, 0);
    const ssRes = truth.reduce((s, t, i) => s + (t - pred[i]) ** 2, 0);
    return parseFloat((1 - ssRes / ssTot).toFixed(4));
  }

  // State getters
  function hasClassModel() { return classModel !== null; }
  function hasRegModel()   { return regModel   !== null; }
  function isBusy()        { return isTrainingClass || isTrainingReg; }

  return {
    trainClassification,
    trainRegression,
    predict,
    hasClassModel,
    hasRegModel,
    isBusy,
    buildConfusionMatrix,
  };
})();
