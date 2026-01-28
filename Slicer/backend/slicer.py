# backend/slicer.py
from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Section
from OCC.Core.gp import gp_Pln, gp_Pnt, gp_Dir
from OCC.Core.TopExp import TopExp_Explorer
from OCC.Core.TopAbs import TopAbs_EDGE
from OCC.Core.BRepAdaptor import BRepAdaptor_Curve




def slice_shape(shape, z_min, z_max, layer_height):
    """Yield line segments for each slicing plane."""
    z = z_min
    layers = []


    while z <= z_max:
        plane = gp_Pln(gp_Pnt(0, 0, z), gp_Dir(0, 0, 1))
        section = BRepAlgoAPI_Section(shape, plane, False)
        section.ComputePCurveOn1(True)
        section.Approximation(True)
        section.Build()


        edges = []
        exp = TopExp_Explorer(section.Shape(), TopAbs_EDGE)
        while exp.More():
            edge = exp.Current()
            curve = BRepAdaptor_Curve(edge)
            p1 = curve.Value(curve.FirstParameter())
            p2 = curve.Value(curve.LastParameter())
            edges.append(((p1.X(), p1.Y()), (p2.X(), p2.Y())))
            exp.Next()


        layers.append((z, edges))
        z += layer_height


    return layers




def generate_gcode(layers, feedrate=1200):
    lines = []
    lines.append("G21 ; mm units")
    lines.append("G90 ; absolute positioning")
    lines.append("G28 ; home")


    for z, edges in layers:
        lines.append(f"; Layer Z={z:.3f}")
        lines.append(f"G1 Z{z:.3f} F300")
