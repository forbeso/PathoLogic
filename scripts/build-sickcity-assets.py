"""Generate SickCity's original modular city kit using Blender 5.
Run: Blender --background --factory-startup --python scripts/build-sickcity-assets.py
Units are meters; +Y is facade-facing in Blender (-Z after glTF export).
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/models/sickcity/designed'
SOURCE=ROOT/'artifacts/sickcity-blender'
OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,hex,metal=0,rough=.65,emission=0):
    rgb=tuple(int(hex[i:i+2],16)/255 for i in (0,2,4))
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    if emission: bs.inputs['Emission Color'].default_value=(*rgb,1);bs.inputs['Emission Strength'].default_value=emission
    return m
cream=mat('Warm limestone','C8BC9E');trim=mat('Pale concrete','E2DBCB');dark=mat('Charcoal steel','202F3D',.5,.4)
glass=mat('Blue glass','345A6D',.45,.2);warm=mat('Occupied windows','F5CA83',.15,.3,.65)
brick=mat('Terracotta brick','965D4F');sage=mat('Sage facade','658C82');blue=mat('Slate blue facade','536D85')
green=mat('Deep evergreen signage','214C44');gold=mat('Brass trim','D2AF63',.65,.35);white=mat('EMS porcelain','E5ECE7',.2,.36)
red=mat('Emergency coral','CF493C');rubber=mat('Tire rubber','172029',0,.85);light=mat('Headlamps','E2F5ED',0,.3,2)
beacon=mat('Blue emergency lens','329DF0',.1,.25,2);leaf=mat('Planter foliage','3E6650');soil=mat('Planter soil','40352D')
assets={}
def box(name,loc,size,material,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def cylinder(name,loc,radius,depth,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=loc,rotation=rotation)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);return o
def text(name,word,loc,size,material):
    bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,math.pi));o=bpy.context.object;o.name=name
    o.data.body=word;o.data.align_x='CENTER';o.data.align_y='CENTER';o.data.size=size;o.data.extrude=.006;o.data.materials.append(material)
    bpy.ops.object.convert(target='MESH');return bpy.context.object
def finish(name,before):
    objects=[o for o in bpy.context.scene.objects if o not in before]
    # Batch by material: keeps repeated buildings inexpensive to draw.
    by={}
    for o in objects: by.setdefault(o.data.materials[0].name,[]).append(o)
    merged=[]
    for group in by.values():
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();o=bpy.context.object
        bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');o.name=name+'_'+o.data.materials[0].name;merged.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in merged:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
    assets[name]=merged

def building(name,floors,facade,label):
    before=set(bpy.context.scene.objects);h=3.4+floors*2.65
    box('Foundation',(0,0,.16),(9.8,8.8,.32),trim)
    box('Facade',(0,0,h/2),(9.2,8.1,h),facade)
    box('Retail base',(0,.01,1.65),(9.35,8.2,3.05),cream)
    for x in [-3.35,-1.15,1.15,3.35]:
        box('Shop frame',(x,4.17,1.55),(1.98,.17,2.35),dark)
        box('Shop glass',(x,4.28,1.55),(1.77,.035,2.11),warm if x<0 else glass,0)
        box('Shop mullion',(x,4.32,1.55),(.055,.06,2.12),gold,0)
    box('Store sign',(0,4.3,2.94),(9,.26,.59),green)
    text('Store lettering',label,(0,4.46,2.95),.34,trim)
    for x in [-3.45,-1.15,1.15,3.45]:
        awning=box('Awning',(x,4.65,2.58),(2.2,1.2,.12),green);awning.rotation_euler.x=.13
        box('Awning edge',(x,5.22,2.5),(2.2,.12,.22),cream)
    for f in range(floors):
        z=4.25+f*2.65
        box('Floor band',(0,0,z-1.08),(9.36,8.26,.15),trim)
        for side in [-1,1]:
            for i,x in enumerate([-3.25,-1.08,1.08,3.25]):
                box('Window surround',(x,side*4.09,z),(1.58,.17,1.89),trim)
                box('Window',(x,side*4.2,z),(1.32,.06,1.65),warm if (i+f)%3 else glass,0)
                box('Window divider',(x,side*4.25,z),(.06,.06,1.7),dark,0)
                box('Window sill',(x,side*4.3,z-.92),(1.8,.35,.12),cream)
        for side in [-1,1]:
            for y in [-2.4,0,2.4]:
                box('Side surround',(side*4.67,y,z),(.15,1.65,1.9),trim)
                box('Side window',(side*4.77,y,z),(.05,1.4,1.64),warm if f%2 else glass,0)
    box('Cornice',(0,0,h),(9.75,8.62,.3),trim)
    box('Flat roof',(0,0,h+.18),(9.15,8.05,.12),dark)
    for x in [-4.5,4.5]:box('Parapet',(x,0,h+.46),(.18,8.2,.5),cream)
    for y in [-4,4]:box('Parapet',(0,y,h+.46),(9.2,.18,.5),cream)
    for x in [-2,1.3]:
        box('Rooftop HVAC',(x,-1,h+.7),(1.6,1.8,1),dark)
        cylinder('HVAC fan',(x,-1,h+1.24),.52,.07,trim)
        for i in range(5):box('Vent slat',(x-.6+i*.3,-.07,h+.72),(.1,.03,.56),trim,0)
    for x in [-4.1,4.1]:
        box('Planter',(x,4.75,.35),(.7,.7,.6),dark)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.55,location=(x,4.75,.94));bpy.context.object.data.materials.append(leaf)
    finish(name,before)

building('market-corner',2,brick,'MAPLE  MARKET')
building('civic-apartments',4,blue,'CIVIC  HOUSE')
building('riverside-cafe',1,sage,'RIVERSIDE  COFFEE')
# Move aside before constructing the ambulance at the origin.
for i,objs in enumerate(assets.values()):
    for o in objs:o.location.x=(i-1)*13
before=set(bpy.context.scene.objects)
box('Patient compartment',(0,-.9,1.65),(2.7,4.1,2.65),white,.12)
box('Cab',(0,1.98,1.28),(2.48,1.65,1.7),white,.16)
box('Cab hood',(0,2.76,.9),(2.42,.8,.7),white,.12)
box('Windshield',(0,2.79,1.92),(2.13,.06,.7),glass,.035)
for x in [-1.27,1.27]:
    box('Cab side glass',(x,1.95,1.89),(.04,1.06,.63),glass,.03)
    box('EMS side stripe',(x*1.07,-.9,1.34),(.06,4.02,.35),red,.01)
    box('Equipment door',(x*1.075,-1.9,.85),(.025,1.4,.62),cream,.015)
    for y in [-2.02,1.95]:
        cylinder('All terrain tire',(x,y,.57),.56,.32,rubber,(0,math.pi/2,0))
        cylinder('Alloy wheel',(x*1.15,y,.57),.29,.025,trim,(0,math.pi/2,0))
    box('Mirror',(x*1.14,2.55,1.95),(.22,.35,.37),dark,.04)
for x in [-.84,.84]:box('Headlight',(x,3.18,1.08),(.48,.07,.28),light,.04)
box('Front grille',(0,3.19,.73),(1.14,.08,.35),dark,.025)
box('Front bumper',(0,3.22,.45),(2.55,.18,.22),dark,.04)
box('Emergency lightbar',(0,1.79,2.27),(2.1,.48,.18),dark)
for x in [-.73,.73]:box('Emergency lens',(x,1.79,2.42),(.63,.43,.18),beacon if x<0 else red,.045)
for x in [-.64,.64]:
    box('Rear door',(x,-2.97,1.69),(1.23,.06,2.26),cream)
    box('Rear glass',(x,-3.015,2.14),(.77,.04,.72),glass)
box('Roof cross horizontal',(0,-.6,3.01),(1.45,.45,.025),red,0)
box('Roof cross vertical',(0,-.6,3.02),(.45,1.45,.025),red,0)
finish('unit-07-ambulance',before)
for o in assets['unit-07-ambulance']:o.location=(0,9,0)
# Source scene and studio render are kept out of the public bundle.
box('Studio floor',(0,0,-.3),(65,55,.25),mat('Studio ground','253B46'),0)
world=bpy.context.scene.world;world.color=(.18,.18,.18);world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.3,.45,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.light_add(type='AREA',location=(-12,6,25));bpy.context.object.data.energy=4200;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=18
bpy.ops.object.light_add(type='SUN',rotation=(.5,-.5,-.4));bpy.context.object.data.energy=2.3;bpy.context.object.data.color=(1,.78,.58)
bpy.ops.object.camera_add(location=(31,45,30));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,5))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=49
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1500;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(SOURCE/'city-kit-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'sickcity-city-kit.blend'))
bpy.ops.render.render(write_still=True)
print('SICKCITY_KIT_COMPLETE')
