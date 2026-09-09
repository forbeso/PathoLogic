"""Convert SickCity FBXs to compact, animated, meter-scale GLBs in Blender."""
import bpy, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/models/sickcity'
ARCHIVE=ROOT/'artifacts/sickcity-source-assets'
REPORT=ROOT/'artifacts/sickcity-blender/character-optimization.json'
NAMES=['medic-walking','pedestrians/pedestrian-standing','pedestrians/pedestrian-walking-1','pedestrians/pedestrian-walking-2','pedestrians/pedestrian-walking-3','props/hell-slammer-a','patients/laying-moaning']
results=json.loads(REPORT.read_text()) if REPORT.exists() else []
for name in NAMES:
    if any(r["name"] == name for r in results) and (PUBLIC/(name+".glb")).exists(): continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source=PUBLIC/(name+'.fbx')
    if not source.exists():source=ARCHIVE/(name+'.fbx')
    bpy.ops.import_scene.fbx(filepath=str(source),use_anim=True)
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    points=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
    bounds=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
    before=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
    ratio=min(1,24000/max(before,1))
    for o in meshes:
        if ratio<1:
            bpy.context.view_layer.objects.active=o
            mod=o.modifiers.new('Game mesh budget','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
            bpy.ops.object.modifier_apply(modifier=mod.name)
    textures=[]
    for im in bpy.data.images:
        if im.size[0] and im.size[1]:
            w,h=im.size[:];ratio=min(1,512/max(w,h))
            if ratio<1:im.scale(max(1,round(w*ratio)),max(1,round(h*ratio)))
            try:
                im.pack();textures.append([im.name,list(im.size)])
            except RuntimeError:
                # Some source FBXs refer to missing optional gloss maps. Keep
                # the shader's default roughness instead of exporting a bad URI.
                for material in bpy.data.materials:
                    if material.use_nodes:
                        for node in list(material.node_tree.nodes):
                            if node.type == 'TEX_IMAGE' and node.image == im:
                                material.node_tree.nodes.remove(node)

    out=PUBLIC/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,
        export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,
        export_frame_step=1,export_skins=True,export_cameras=False,export_lights=False,
        export_image_format='JPEG',export_jpeg_quality=82)
    results.append(dict(name=name,input_bytes=source.stat().st_size,output_bytes=out.stat().st_size,
                        input_triangles=before,bounds_meters=bounds,textures=textures))
    REPORT.write_text(json.dumps(results,indent=2))
    print('OPTIMIZED',name,source.stat().st_size,'->',out.stat().st_size,flush=True)
print('CHARACTERS_COMPLETE',flush=True)
