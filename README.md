# FuelBlend_ShellAI_Prototype

## How to Deploy
``` bash
git clone https://github.com/akhil838/FuelBlend_ShellAI_Prototype.git
```
### Backend
Replace image_name with custom name you want to give for image<br>
Currently the repo and model weights are private, it can be accessed only through authorized HF_TOKEN
``` bash
cd Backend
docker build -t image_name .
docker run -p 8000:8000 -e HF_TOKEN=authorized_hugging_face_token --gpus all -v mongo-data:/data/db image_name
```
The Backend will start running on port 8000

### Frontend
``` bash
cd Frontend
npm install
npm start
```
The frontend will start running on port 3000
