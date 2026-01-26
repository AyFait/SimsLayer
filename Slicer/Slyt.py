import datetime #libarary for handling timestamps
import pyslm #library for slicing
from pyslm import hatching
import numpy as np #library for handling arrays
import os #To get cad file directory
from pathlib import Path
import tkinter as tk #library for GUI dialogs
from tkinter import filedialog
import pyvista as pv #library for 3D visualization
import trimesh #library for 3D mesh processing
import matplotlib.pyplot as plt #library for plotting sliced layers



def slice_step_to_stl(input_file_path, output_folder, layer_thickness=0.04):
    """
    Slice a STEP file and save the resulting STL file in a designated folder.
    
    Parameters:
    - input_file_path (str): Path to the input STEP file
    - output_folder (str): Path to the output folder where STL will be saved
    - layer_thickness (float): Layer thickness in mm (default: 0.04mm)
    """
    
    # Ensure output folder exists
    Path(output_folder).mkdir(parents=True, exist_ok=True)
    currentTime = datetime.datetime.now()
    
    try:
        # Get input file name without extension
        file_name = os.path.splitext(os.path.basename(input_file_path))[0]
        output_stl_path = os.path.join(output_folder, f"{file_name}_sliced{currentTime}.stl")
        
        print(f"Loading STEP file: {input_file_path}")
        
        # Create a part and load the geometry
        part = pyslm.Part(file_name)
        part.setGeometry(input_file_path)
        scene = trimesh.load(input_file_path)
        mesh = trimesh.util.concatenate(scene.dump())
        pv.wrap(mesh).plot()

        part.dropToPlatform()
        
        print(f"Part loaded successfully")
        print(f"Bounding Box: {part.boundingBox}")
        
        # Setup hatching strategy
        myHatcher = hatching.Hatcher()
        myHatcher.hatchAngle = 10
        myHatcher.volumeOffsetHatch = 0.08
        myHatcher.spotCompensation = 0.06
        myHatcher.numInnerContours = 2
        myHatcher.numOuterContours = 1
        myHatcher.hatchSortMethod = hatching.AlternateSort()
        
        # Perform slicing and hatching
        print("Starting slicing process...")
        layers = []
        
        z_min = float(part.boundingBox[2])
        z_max = float(part.boundingBox[5])
        # ensure correct ordering
        if z_min > z_max:
            z_min, z_max = z_max, z_min
        # include the top plane and generate slice heights
        z_positions = np.arange(z_min, z_max + 1e-9, layer_thickness)
        if z_positions.size == 0:
            raise RuntimeError(f"No layers computed: z_min={z_min}, z_max={z_max}, layer_thickness={layer_thickness}")

        for z in z_positions:
        #for z in np.arange(z_min, z_max, layer_thickness):
            myHatcher.hatchAngle += 66.7  # Rotate hatch pattern per layer
            geomSlice = part.getVectorSlice(z)
            layer = myHatcher.hatch(geomSlice)
            layer.z = int(z * 1000)
            layers.append(layer)
        
        print(f"Slicing completed. Total layers: {len(layers)}")
        
        # Save the result
        print(f"Saving sliced model to: {output_stl_path}")
        # Note: pyslm saves layers, you may need to use additional processing
        # to generate the final STL file depending on your specific requirements
        
        print("Process completed successfully!")

        layer_to_plot = layers[len(layers)//2]  # middle layer
        plt.figure()
        for hatch in layer_to_plot.hatches:
            x, y = zip(*hatch)
            plt.plot(x, y)
        plt.gca().set_aspect('equal')
        plt.title("Sliced hatch pattern (one layer)")
        plt.show()

        return output_stl_path
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise

def main():
    """Main function to get input from user and process the file"""
    
    print("="*30)
    print("STEP File Slicer using PySLM")
    print("="*30)
    
    # Get input file path from user
    '''
    input_file = input("\nEnter the path to your STEP file: ").strip() #Select input file
     # Verify input file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found!")
        return
    '''
    root = tk.Tk()
    root.withdraw()  # Hide the root window
    inputFile = filedialog.askopenfilename(
        title="Select the file to process",  # Customize the title
        filetypes=(("All files", "*.*"), ("Text files", "*.txt"))  # Optional: Filter file types
                )

    # Check if a file was selected
    if not inputFile:
        print("No file selected. Exiting.")
        exit()  # Or handle cancellation as needed
    
   
    # Get output folder from user
    '''output_folder = input("Enter the output folder path (default: ./sliced_output): ").strip() #Select output folder
    if not output_folder:
        output_folder = "./sliced_output"
    '''
    outputFile = filedialog.askdirectory(
        title="Select Output Folder",  # Customize the title
                )
    # Optional: Get layer thickness
    thickness_input = input("Enter layer thickness in mm (default: 0.04): ").strip()
    layer_thickness = 0.04
    try:
        if thickness_input:
            layer_thickness = float(thickness_input)
    except ValueError:
        print("Invalid thickness value, using default 0.04mm")
    
    # Process the file
    print("\nProcessing...")
    try:
        output_path = slice_step_to_stl(inputFile, outputFile, layer_thickness)
        print(f"\n✓ Successfully processed: {output_path}")
        
       

    except Exception as e:
        print(f"\n✗ Failed to process file: {str(e)}")

if __name__ == "__main__":
    main()
