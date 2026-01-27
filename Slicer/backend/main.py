# backend/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import uuid


# pythonocc imports
from OCC.Core.STEPControl import STEPControl_Reader
from OCC.Core.TopExp import TopExp_Explorer
from OCC.Core.TopAbs import TopAbs_SOLID
from OCC.Core.TopoDS import topods
from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
from OCC.Core.StlAPI import StlAPI_Writer


app = FastAPI()
WORKDIR = os.path.abspath("./workspace")
os.makedirs(WORKDIR, exist_ok=True)




def convert_step_to_stl(step_path: str, stl_path: str, linear_deflection: float = 0.1):
"""Read STEP, mesh solids, write STL.


linear_deflection: target accuracy for tessellation (lower => finer mesh)
"""
# STEP read
reader = STEPControl_Reader()
status = reader.ReadFile(step_path)
if status != 1:
raise RuntimeError("Failed to read STEP file")
reader.TransferRoots()
shape = reader.OneShape()


# Mesh the shape
# BRepMesh_IncrementalMesh(shape, linear_deflection) will create triangulation
mesh = BRepMesh_IncrementalMesh(shape, linear_deflection)


# Export to STL
stl_writer = StlAPI_Writer()
stl_writer.SetASCIIMode(False)
success = stl_writer.Write(shape, stl_path)
if not success:
raise RuntimeError("Failed to write STL")




@app.post("/convert")
async def convert(file: UploadFile = File(...), linear_deflection: float = 0.1):
# Accept only STEP extensions (basic check)
filename = file.filename
if not filename.lower().endswith(('.step', '.stp')):
raise HTTPException(status_code=400, detail="Upload a .step or .stp file")


uid = str(uuid.uuid4())
step_path = os.path.join(WORKDIR, f"{uid}.step")
stl_path = os.path.join(WORKDIR, f"{uid}.stl")


# Save uploaded file
with open(step_path, 'wb') as f:
shutil.copyfileobj(file.file, f)


try:
convert_step_to_stl(step_path, stl_path, linear_deflection=linear_deflection)
except Exception as e:
# keep files for debugging; raise an error to the client
raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


# Return STL as a file response
return FileResponse(stl_path, filename=os.path.basename(stl_path), media_type='application/octet-stream')




if __name__ == '__main__':
import uvicorn
uvicorn.run(app, host='127.0.0.1', port=8000)
