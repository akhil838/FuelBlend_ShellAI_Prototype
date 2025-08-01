from tabpfn import TabPFNRegressor
from tabpfn.model.loading import (
    load_fitted_tabpfn_model,
    save_fitted_tabpfn_model,
)
from pathlib import Path
from tabpfn_extensions import TunedTabPFNRegressor
import pickle
from sklearn.metrics import mean_absolute_percentage_error
import optuna
from sklearn.model_selection import train_test_split, KFold
import warnings
import numpy as np
from tqdm import tqdm, trange
from huggingface_hub import snapshot_download
import os
warnings.filterwarnings('ignore')


import os
os.environ['TABPFN_ALLOW_CPU_LARGE_DATASET'] = '1'
import pandas as pd
import pickle
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import optuna
from tabpfn import TabPFNRegressor
import tabpfn, tabpfn_extensions
from tqdm import tqdm, trange
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_absolute_percentage_error, mean_absolute_error, r2_score
from tabpfn_extensions.post_hoc_ensembles.sklearn_interface import AutoTabPFNRegressor
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from tabpfn_extensions.hpo import TunedTabPFNRegressor
import warnings 
warnings.filterwarnings('ignore')
import numpy as np
from pathlib import Path
from tabpfn.model.loading import (
    load_fitted_tabpfn_model,
    save_fitted_tabpfn_model,
)


class TrainedTabPFN():
    def __init__(self):
        print('Downloading trained TabPFN models from HuggingFace Hub')
        # snapshot_download(repo_id='akhil838/FuelBlend_Trained_TabPFNmodels', local_dir='./model/weights', token = os.environ.get('HF_TOKEN') )
        print('Saved to weights folder')
        print(os.path.abspath('.'))
        self.models = {
            "BlendProperty1":{#97.866 ### + 
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty1.tabpfn_fit"), device="cuda"), ['Component5_Property8', 'Weighted_Component3_Property4']], #97.87
                1:[(lambda f: pickle.load(f))(open('./model/weights/fold1_BlendProperty1_97.8290.tabpfn_fit', 'rb')), ['Component1_fraction']], #97.23
                2:[(lambda f: pickle.load(f))(open('./model/weights/fold2_BlendProperty1_98.6112.tabpfn_fit', 'rb')), ['Weighted_Component4_Property7', 'Weighted_Component5_Property3', 'Weighted_Component2_Property10']], #98.40
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty1.tabpfn_fit"), device="cuda"), ['Weighted_avg_prop9', 'Component1_Property4']], #97.58
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty1.tabpfn_fit"), device="cuda"), ['Component1_fraction', 'Weighted_Component2_Property4']], #98.25
            },
            'BlendProperty2':{#97.96, ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty2.tabpfn_fit"), device="cuda"), ['Component2_Property3']], #97.78
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty2.tabpfn_fit"), device="cuda"), ['Component2_Property3', 'Component3_Property2']], #97.16
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty2.tabpfn_fit"), device="cuda"), ['Weighted_Component5_Property2', 'Component3_Property5', 'Component2_Property10']], #97.89
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty2.tabpfn_fit"), device="cuda"), ['Component2_Property3', 'Component3_Property3', 'Component4_Property2']], #98.449
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty2.tabpfn_fit"), device="cuda"), ['Weighted_Component3_Property3', 'Weighted_Component5_Property8', 'Weighted_avg_prop1', 'Component2_Property9']], # 98.54
            },
            'BlendProperty3':{#89.668, ### + 
                0:[(lambda f: pickle.load(f))(open('./model/weights/fold0_BlendProperty3_91.7905.tabpfn_fit', 'rb')), ['Component3_fraction', 'Weighted_Component5_Property4', 'Weighted_Component1_Property8', 'Component3_Property1', 'Weighted_Component2_Property9']], #88.85,
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty3.tabpfn_fit"), device="cuda"), ['Component2_Property9', 'Component1_Property5', 'Component2_Property8', 'Weighted_Component1_Property4']],  #94.53,
                2:[(lambda f: pickle.load(f))(open('./model/weights/fold2_BlendProperty3_94.4592.tabpfn_fit', 'rb')), ['Weighted_avg_prop7', 'Weighted_Component2_Property7', 'Component3_Property9']],# 86.80,
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty3.tabpfn_fit"), device="cuda"), ['Component4_fraction', 'Weighted_Component3_Property1', 'Component1_Property2']], #86.37,
                4:[(lambda f: pickle.load(f))(open("./model/weights/fold4_BlendProperty3_92.4793.tabpfn_fit", 'rb')), ['Component3_Property7', 'Weighted_Component3_Property6', 'Weighted_avg_prop7']], #91.79
            },
            'BlendProperty4':{#97.98 ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty4.tabpfn_fit"), device="cuda"), ['Component1_fraction']],  # 97.53,
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty4.tabpfn_fit"), device="cuda"), ['Weighted_Component3_Property9', 'Weighted_Component2_Property1']], # 98.511 ,
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty4.tabpfn_fit"), device="cuda"), ['Weighted_Component3_Property8', 'Component3_Property1', 'Component1_Property4']], # 97.805
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty4.tabpfn_fit"), device="cuda"), ['Component3_fraction', 'Component4_Property4', 'Component1_Property2', 'Weighted_avg_prop9']], # 97.49
                4:[(lambda f: pickle.load(f))(open('./model/weights/fold4_BlendProperty4_98.7612.tabpfn_fit', 'rb')), ['Component1_Property1', 'Component4_Property4', 'Weighted_avg_prop5', 'Weighted_avg_prop8']], # 98.59
            },
            'BlendProperty5':{#99.07, ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty5.tabpfn_fit"), device="cuda"), ['Weighted_Component1_Property5', 'Weighted_Component5_Property3']], #99.50,
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty5.tabpfn_fit"), device="cuda"), ['Component1_Property9']], # 99.01,
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty5.tabpfn_fit"), device="cuda"), ['Component5_Property3', 'Component2_Property8', 'Weighted_Component4_Property5']], #99.39,
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty5.tabpfn_fit"), device="cuda"), ['Weighted_Component3_Property5', 'Component1_fraction']], # 98.88,
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty5.tabpfn_fit"), device="cuda"), ['Component2_Property5', 'Weighted_avg_prop5', 'Weighted_Component3_Property5']], #98.55,
            },
            'BlendProperty6':{#98.6 ### + 
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty6.tabpfn_fit"), device="cuda"), ['Weighted_Component3_Property3', 'Component1_fraction', 'Weighted_avg_prop8']], #97.84
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty6.tabpfn_fit"), device="cuda"), ['Weighted_Component1_Property1', 'Weighted_avg_prop1', 'Component1_Property8']], #98.93
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty6.tabpfn_fit"), device="cuda"), ['Weighted_Component4_Property5']], #98.33
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty6.tabpfn_fit"), device="cuda"), ['Component4_Property9', 'Component4_Property10']], #98.95
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty6.tabpfn_fit"), device="cuda"), ['Weighted_avg_prop2', 'Weighted_Component3_Property9']], #98.95
            },
            'BlendProperty7':{#89.17, ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty7.tabpfn_fit"), device="cuda"), ['Component3_fraction', 'Weighted_avg_prop7', 'Component3_Property7', 'Weighted_avg_prop8', 'Component5_Property10', 'Weighted_Component1_Property2']], #91.68,
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty7.tabpfn_fit"), device="cuda"), ['Component2_fraction', 'Weighted_Component4_Property5', 'Weighted_Component3_Property3', 'Component2_Property8']], #89.05,
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty7.tabpfn_fit"), device="cuda"), ['Component2_fraction', 'Weighted_avg_prop5', 'Weighted_Component3_Property8', 'Weighted_avg_prop7', 'Component2_Property2']], #84.63,
                3:[(lambda f: pickle.load(f))(open('./model/weights/fold3_BlendProperty7_85.8353.tabpfn_fit', 'rb')), ['Component3_Property7', 'Component4_fraction']],  #90.504,
                4:[(lambda f: pickle.load(f))(open('./model/weights/fold4_BlendProperty7_91.6077.tabpfn_fit', 'rb')), ['Component5_fraction', 'Weighted_Component5_Property10', 'Weighted_avg_prop3']] #89.97
            },
            'BlendProperty8':{#91.612, ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty8.tabpfn_fit"), device="cuda"), ['Weighted_Component5_Property7', 'Weighted_Component3_Property8', 'Weighted_avg_prop6', 'Weighted_Component2_Property9', 'Weighted_Component5_Property6']],# 88.76,
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty8.tabpfn_fit"), device="cuda"), ['Component1_fraction', 'Weighted_Component5_Property7']], #94.43,
                2:[(lambda f: pickle.load(f))(open('./model/weights/fold2_BlendProperty8_93.2313.tabpfn_fit', 'rb')),  ['Weighted_Component5_Property6', 'Weighted_avg_prop9']],  #88.60
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty8.tabpfn_fit"), device="cuda"), ['Component3_fraction', 'Weighted_avg_prop8', 'Weighted_Component5_Property8', 'Component5_Property8', 'Weighted_Component5_Property7', 'Component3_Property3']],  # 93.04
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty8.tabpfn_fit"), device="cuda"),  ['Component3_fraction', 'Component3_Property6', 'Weighted_Component5_Property7']], #93.23,
            },
            'BlendProperty9':{#88.88, ### +
                0:[load_fitted_tabpfn_model(Path("./model/weights/fold0_BlendProperty9.tabpfn_fit"), device="cuda"),['Weighted_avg_prop9', 'Component3_fraction']], #90.30 tabpf
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty9.tabpfn_fit"), device="cuda"),['Weighted_avg_prop9', 'Weighted_Component2_Property2']], #87.25
                2:[load_fitted_tabpfn_model(Path("./model/weights/fold2_BlendProperty9.tabpfn_fit"), device="cuda"),['Component2_fraction', 'Weighted_avg_prop6']], #92.14 tabpf
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty9.tabpfn_fit"), device="cuda"),['Weighted_Component4_Property6']], #90.99 tabpf
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty9.tabpfn_fit"), device="cuda"),['Weighted_avg_prop9']], #83.73
            },

            'BlendProperty10':{#97.72 ### + 
                0:[(lambda f: pickle.load(f))(open('./model/weights/fold0_BlendProperty10_99.4143.tabpfn_fit', 'rb')), ['Component3_fraction', 'Weighted_Component4_Property2', 'Weighted_Component5_Property9']], #98.42
                1:[load_fitted_tabpfn_model(Path("./model/weights/fold1_BlendProperty10.tabpfn_fit"), device="cuda"), ['Component1_fraction', 'Component3_Property1']], #95.92
                2:[(lambda f: pickle.load(f))(open('./model/weights/fold2_BlendProperty10_97.8637.tabpfn_fit', 'rb')), ['Weighted_Component2_Property2']], #98.27
                3:[load_fitted_tabpfn_model(Path("./model/weights/fold3_BlendProperty10.tabpfn_fit"), device="cuda"), ['Component1_fraction', 'Component2_Property1']], #97.93
                4:[load_fitted_tabpfn_model(Path("./model/weights/fold4_BlendProperty10.tabpfn_fit"), device="cuda"), ['Weighted_Component4_Property10', 'Weighted_Component2_Property4']], #98.102
            }

        }
        self.folds = KFold(n_splits=5, shuffle=True, random_state=42)
        self.target_columns = ['BlendProperty1', 'BlendProperty2', 'BlendProperty3', 'BlendProperty4', 'BlendProperty5',
                  'BlendProperty6', 'BlendProperty7', 'BlendProperty8', 'BlendProperty9', 'BlendProperty10']

    def predict(self, X):
        X = self.preprocess(X)
        final_pred = []
        # Initialize a list to store predictions for each fold
        for fold_idx in range(5):
            fold_preds = []
            for col in tqdm(y.columns):
                model = self.models[col][fold_idx][0]
                used_features = self.models[col][fold_idx][1]

                # Drop irrelevant columns only once per column
                X_test = X.drop(used_features + ['ID'], axis=1)

                # Predict in batch (all rows at once)
                pred_col = model.predict(X_test)
                fold_preds.append(pred_col)  # shape: (n_samples,)

            # Transpose to shape (n_samples, n_targets)
            fold_preds = np.array(fold_preds).T  # shape: (500, 10)
            print(fold_preds.shape)
            final_pred.append(fold_preds)

        final_pred = np.array(final_pred)  # shape: (5, 500, 10)
        print(final_pred.shape)

    def preprocess(self, X):
        for col in ['Component1_fraction', 'Component2_fraction', 'Component3_fraction', 'Component4_fraction',
                    'Component5_fraction']:
            for i in range(1, 11):
                c = col.split('_')[0] + '_' + f'Property{i}'
                X[f'Weighted_{c}'] = X[col] * X[c]

        for i in range(1, 11):
            X[f'Weighted_avg_prop{i}'] = sum(
                X[f'Component{j}_fraction'] * X[f'Component{j}_Property{i}'] for j in range(1, 6))

        return X


    def evaluate(self, X,y):
        X = self.preprocess(X)

        final_pred = []
        # Initialize a list to store predictions for each fold
        for fold_idx in range(5):
            fold_preds = []

            for col in tqdm(y.columns):
                model = self.models[col][fold_idx][0]
                used_features = self.models[col][fold_idx][1]

                # Drop irrelevant columns only once per column
                X_test = X.drop(used_features + ['ID'], axis=1)

                # Predict in batch (all rows at once)
                pred_col = model.predict(X_test)
                fold_preds.append(pred_col)  # shape: (n_samples,)

            # Transpose to shape (n_samples, n_targets)
            fold_preds = np.array(fold_preds).T  # shape: (500, 10)
            print(fold_preds.shape)
            final_pred.append(fold_preds)

        final_pred = np.array(final_pred)  # shape: (5, 500, 10)
        final_pred = self.weighted_mean(final_pred)
        return mean_absolute_percentage_error(y, final_pred)


    def estimate_fractions(self, X, y, n_trials=100):

        def objective(trial):
            k = 5  # Number of components in the Dirichlet distribution
            ratios = np.zeros(k)
            for i in range(k):
                ratios[i] = trial.suggest_float(f'fraction_{i}', 0, 1)

            # Normalize to ensure they sum to 1
            if ratios.sum() == 0:  # Handle edge case where all ratios are 0
                normalized_ratios = np.ones(k) / k
            else:
                normalized_ratios = ratios / ratios.sum()

            for i in range(k):
                X[f'Component{i}_fraction'] = normalized_ratios[i]
            X = self.preprocess(X)

            preds = self.predict(X)

            return mean_absolute_percentage_error(preds, y)

        study = optuna.create_study(direction='minimize')
        study.optimize(objective, n_trials=n_trials)

        best_fractions = study.best_params
        if best_fractions.sum() == 0:  # Handle edge case where all ratios are 0
            best_fractions = np.ones(k) / k
        else:
            best_fractions = best_fractions / best_fractions.sum()



    def weighted_mean(self, preds):
        print(preds.shape)
        d, r, c = preds.shape
        final_pred = [[0 for i in range(c)] for j in range(r)]

        for i in range(r):
            for j in range(c):  # 3 7 8 9
                f1, f2, f3, f4, f5 = [0.2, 0.2, 0.2, 0.2, 0.2]

                if j + 1 == 1:
                    f1, f2, f3, f4, f5 = [0.2, 0.2, 0.2, 0.2, 0.2]
                elif j + 1 == 3:  ###
                    f1, f2, f3, f4, f5 = [0.4, 0.05, 0.15, 0.05, 0.35]  # [0.15,0.1,0.15,0.5,0.1]
                elif j + 1 == 4:
                    f1, f2, f3, f4, f5 = [0.5, 0.1, 0.3, 0.05, 0.05]
                elif j + 1 == 5:
                    f1, f2, f3, f4, f5 = [0.3, 0.3, 0.1, 0.1, 0.2]
                elif j + 1 == 6:
                    f1, f2, f3, f4, f5 = [0.1, 0.1, 0.4, 0.1, 0.3]
                elif j + 1 == 7:  ###
                    f1, f2, f3, f4, f5 = [1.5, -0.2, -0.1, -0.15, -0.05]  ### 3 [0.2,0.05,0.05,0.4,0.3] == 93.083
                elif j + 1 == 8:  ###
                    f1, f2, f3, f4, f5 = [-0.05, 0.54, -0.05, 0.6,
                                          -0.05]  # [0.5,0.03,0.03,0.36,0.03] ### 2 [0.5,0.03,0.03,0.36,0.03] == 92.986
                elif j + 1 == 9:  ###
                    f1, f2, f3, f4, f5 = [0.22, 0.1, 0.3, 0.18,
                                          0.18]  ### 1 [1,0,0,0,0] == 93 | [0.92,0.015,0.05,0.01,0.005] == 92.93 | [0.97,0.05,-0.1,-0.15,-0.1]
                elif j + 1 == 10:
                    f1, f2, f3, f4, f5 = [0.1, 0.1, 0.15, 0.5, 0.15]  ### 4 [0,0,0,1,0]  | [0.03,0.03,0.03,0.88,0.03]
                final_pred[i][j] = preds[0][i][j] * f1 + preds[1][i][j] * f2 + preds[2][i][j] * f3 + preds[3][i][
                    j] * f4 + preds[4][i][j] * f5

        final_pred = np.array(final_pred)
        print(final_pred.shape)
        return final_pred


