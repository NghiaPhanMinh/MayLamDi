export type CustomShape = {
  id: string;
  name: string;
  type: "circle" | "ellipse" | "rect" | "polygon" | "path";
  fill: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  points: string;
  d: string;
  rotate: number;
};

export type OriginalShape = {
  id: string;
  name: string;
  type: "path" | "polygon" | "circle" | "ellipse" | "rect";
  defaultFill: string;
  group?: "backWing" | "frontWing" | "tail" | "dorsalSpines" | "backLeg" | "torso" | "frontLeg" | "frontArm" | "headNeck" | "frontClaw";
  d?: string;
  points?: string;
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

// Static definitions of all ~65 original dragon shapes
export const DRAGON_ORIGINAL_SHAPES: OriginalShape[] = [
  // 1. Back Wing
  { id: "backWing_membrane1", name: "Back Wing Membrane 1", type: "path", defaultFill: "#7f1d1d", group: "backWing", d: "M 120 110 Q 180 -40 320 -70 Q 250 10 210 70 Q 160 50 120 110 Z" },
  { id: "backWing_membrane2", name: "Back Wing Membrane 2", type: "path", defaultFill: "#991b1b", group: "backWing", d: "M 320 -70 Q 270 20 230 85 Q 180 80 120 110 Q 200 10 320 -70 Z" },
  { id: "backWing_membrane3", name: "Back Wing Membrane 3", type: "path", defaultFill: "#450a0a", group: "backWing", d: "M 230 85 Q 180 40 120 110 Q 170 80 230 85 Z" },
  { id: "backWing_strut1", name: "Back Wing Bone Strut 1", type: "path", defaultFill: "none", group: "backWing", d: "M 120 110 Q 220 -20 320 -70" },
  { id: "backWing_strut2", name: "Back Wing Bone Strut 2", type: "path", defaultFill: "none", group: "backWing", d: "M 120 110 Q 185 10 230 85" },
  { id: "backWing_joint", name: "Back Wing Joint", type: "circle", defaultFill: "#f97316", group: "backWing", cx: 320, cy: -70, r: 5 },
  { id: "backWing_claw", name: "Back Wing Claw", type: "polygon", defaultFill: "#ea580c", group: "backWing", points: "320,-70 334,-84 324,-58" },

  // 2. Front Wing
  { id: "frontWing_membrane1", name: "Front Wing Membrane 1", type: "path", defaultFill: "#991b1b", group: "frontWing", d: "M 110 115 Q 10 -40 -80 -60 Q 0 15 50 80 Q 80 60 110 115 Z" },
  { id: "frontWing_membrane2", name: "Front Wing Membrane 2", type: "path", defaultFill: "#7f1d1d", group: "frontWing", d: "M -80 -60 Q -10 35 30 100 Q 70 85 130 125 Z" },
  { id: "frontWing_membrane3", name: "Front Wing Membrane 3", type: "path", defaultFill: "#450a0a", group: "frontWing", d: "M 30 100 Q 65 60 130 125 Q 75 95 30 100 Z" },
  { id: "frontWing_strut1", name: "Front Wing Bone Strut 1", type: "path", defaultFill: "none", group: "frontWing", d: "M 110 115 Q 20 10 -80 -60" },
  { id: "frontWing_strut2", name: "Front Wing Bone Strut 2", type: "path", defaultFill: "none", group: "frontWing", d: "M 110 115 Q 50 30 30 100" },
  { id: "frontWing_joint", name: "Front Wing Joint", type: "circle", defaultFill: "#f97316", group: "frontWing", cx: -70, cy: -50, r: 5 },
  { id: "frontWing_claw", name: "Front Wing Claw", type: "polygon", defaultFill: "#ea580c", group: "frontWing", points: "-70,-50 -85,-65 -74,-38" },

  // 3. Tail
  { id: "tail_seg1", name: "Tail Segment 1", type: "path", defaultFill: "#7f1d1d", group: "tail", d: "M 160 150 Q 220 160 255 190 L 240 215 Q 215 190 165 175 Z" },
  { id: "tail_seg2", name: "Tail Segment 2", type: "path", defaultFill: "#991b1b", group: "tail", d: "M 255 190 Q 285 225 265 260 L 245 255 Q 260 235 240 215 Z" },
  { id: "tail_seg3", name: "Tail Segment 3", type: "path", defaultFill: "#b91c1c", group: "tail", d: "M 265 260 Q 240 280 205 270 L 210 255 Q 235 262 245 255 Z" },
  { id: "tail_shadow", name: "Tail Shadow Overlay", type: "path", defaultFill: "#450a0a", group: "tail", d: "M 245 255 Q 235 262 205 270 Q 220 285 245 255 Z" },
  { id: "tail_barb1", name: "Tail Barb Tip 1", type: "polygon", defaultFill: "#dc2626", group: "tail", points: "205,270 170,290 192,260" },
  { id: "tail_barb2", name: "Tail Barb Tip 2", type: "polygon", defaultFill: "#ea580c", group: "tail", points: "205,270 182,252 196,263" },
  { id: "tail_barb3", name: "Tail Barb Tip 3", type: "polygon", defaultFill: "#f97316", group: "tail", points: "205,270 188,285 198,272" },
  { id: "tail_spine1", name: "Tail Spine 1", type: "polygon", defaultFill: "#dc2626", group: "tail", points: "230,170 242,158 238,175" },
  { id: "tail_spine2", name: "Tail Spine 2", type: "polygon", defaultFill: "#dc2626", group: "tail", points: "275,215 290,208 280,225" },
  { id: "tail_spine3", name: "Tail Spine 3", type: "polygon", defaultFill: "#dc2626", group: "tail", points: "255,262 268,272 250,268" },

  // 4. Dorsal Spines
  { id: "spine1", name: "Dorsal Spine 1", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "35,42 22,22 42,35" },
  { id: "spine2", name: "Dorsal Spine 2", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "55,58 45,38 62,52" },
  { id: "spine3", name: "Dorsal Spine 3", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "80,78 72,58 88,72" },
  { id: "spine4", name: "Dorsal Spine 4", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "105,98 94,82 110,95" },
  { id: "spine5", name: "Dorsal Spine 5", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "135,118 122,100 138,114" },
  { id: "spine6", name: "Dorsal Spine 6", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "165,138 152,120 168,134" },
  { id: "spine7", name: "Dorsal Spine 7", type: "polygon", defaultFill: "#dc2626", group: "dorsalSpines", points: "195,152 182,135 198,148" },

  // 5. Back Leg
  { id: "backLeg_thigh", name: "Back Leg Thigh", type: "path", defaultFill: "#450a0a", group: "backLeg", d: "M 150 145 C 205 160 210 205 185 215 C 145 205 140 180 150 145 Z" },
  { id: "backLeg_knee", name: "Back Leg Knee Joint", type: "circle", defaultFill: "#310606", group: "backLeg", cx: 185, cy: 215, r: 14 },
  { id: "backLeg_calf", name: "Back Leg Calf", type: "path", defaultFill: "#450a0a", group: "backLeg", d: "M 185 215 L 165 255 L 140 248 L 170 208 Z" },
  { id: "backLeg_ankle", name: "Back Leg Ankle Joint", type: "circle", defaultFill: "#1c0303", group: "backLeg", cx: 165, cy: 255, r: 9 },
  { id: "backLeg_foot", name: "Back Leg Foot", type: "path", defaultFill: "#450a0a", group: "backLeg", d: "M 165 255 L 125 264 L 128 252 L 158 246 Z" },
  { id: "backLeg_claw1", name: "Back Leg Talon 1", type: "polygon", defaultFill: "#ffffff", group: "backLeg", points: "125,264 102,276 120,256" },
  { id: "backLeg_claw2", name: "Back Leg Talon 2", type: "polygon", defaultFill: "#ffffff", group: "backLeg", points: "128,266 108,280 125,258" },
  { id: "backLeg_claw3", name: "Back Leg Talon 3", type: "polygon", defaultFill: "#ffffff", group: "backLeg", points: "132,268 114,284 130,260" },

  // 6. Torso & Chest
  { id: "torso_base", name: "Torso Main Frame", type: "path", defaultFill: "#7f1d1d", group: "torso", d: "M 50 110 C 115 65 200 100 185 180 C 145 210 70 195 50 110 Z" },
  { id: "torso_plate1", name: "Torso Muscle Overlay 1", type: "path", defaultFill: "#580e0e", group: "torso", d: "M 150 135 C 195 150 185 195 140 185 Z" },
  { id: "torso_plate2", name: "Torso Muscle Overlay 2", type: "path", defaultFill: "#450a0a", group: "torso", d: "M 105 75 C 175 110 175 185 125 195 C 155 155 138 100 105 75 Z" },
  { id: "torso_chest1", name: "Chest Segment Plate 1", type: "path", defaultFill: "#b91c1c", group: "torso", d: "M 58 122 C 92 150 135 145 150 135 Q 130 170 66 152 Z" },
  { id: "torso_chest2", name: "Chest Segment Plate 2", type: "path", defaultFill: "#dc2626", group: "torso", d: "M 64 132 C 94 158 130 152 142 142 Q 122 174 72 160 Z" },
  { id: "torso_chest3", name: "Chest Segment Plate 3", type: "path", defaultFill: "#ea580c", group: "torso", d: "M 70 142 C 98 165 125 158 135 148 Q 115 178 78 166 Z" },
  { id: "torso_chest4", name: "Chest Segment Plate 4", type: "path", defaultFill: "#f97316", group: "torso", d: "M 76 152 C 100 170 120 164 128 154 Q 110 182 84 172 Z" },
  { id: "torso_chest5", name: "Chest Segment Plate 5", type: "path", defaultFill: "#fef08a", group: "torso", d: "M 82 162 C 102 176 116 170 122 160 Q 106 186 90 178 Z" },

  // 7. Front Leg
  { id: "frontLeg_thigh", name: "Front Leg Thigh", type: "path", defaultFill: "#991b1b", group: "frontLeg", d: "M 145 150 C 195 165 198 210 175 220 C 135 210 132 185 145 150 Z" },
  { id: "frontLeg_knee", name: "Front Leg Knee Joint", type: "circle", defaultFill: "#7f1d1d", group: "frontLeg", cx: 175, cy: 220, r: 14 },
  { id: "frontLeg_calf", name: "Front Leg Calf", type: "path", defaultFill: "#991b1b", group: "frontLeg", d: "M 175 220 L 155 260 L 130 252 L 160 212 Z" },
  { id: "frontLeg_ankle", name: "Front Leg Ankle Joint", type: "circle", defaultFill: "#580e0e", group: "frontLeg", cx: 155, cy: 260, r: 9 },
  { id: "frontLeg_foot", name: "Front Leg Foot", type: "path", defaultFill: "#991b1b", group: "frontLeg", d: "M 155 260 L 115 270 L 118 258 L 148 252 Z" },
  { id: "frontLeg_claw1", name: "Front Leg Talon 1", type: "polygon", defaultFill: "#ffffff", group: "frontLeg", points: "115,270 92,284 110,262" },
  { id: "frontLeg_claw2", name: "Front Leg Talon 2", type: "polygon", defaultFill: "#ffffff", group: "frontLeg", points: "118,272 98,288 114,264" },
  { id: "frontLeg_claw3", name: "Front Leg Talon 3", type: "polygon", defaultFill: "#ffffff", group: "frontLeg", points: "122,274 104,292 118,266" },

  // 8. Front Arm
  { id: "frontArm_shoulder", name: "Shoulder Joint", type: "circle", defaultFill: "#991b1b", group: "frontArm", cx: 95, cy: 120, r: 15 },
  { id: "frontArm_bicep", name: "Muscular Bicep", type: "path", defaultFill: "#991b1b", group: "frontArm", d: "M 95 120 L 60 155 L 45 145 L 82 112 Z" },
  { id: "frontArm_elbow", name: "Elbow Joint", type: "circle", defaultFill: "#7f1d1d", group: "frontArm", cx: 60, cy: 155, r: 9 },
  { id: "frontArm_forearm", name: "Forearm Frame", type: "path", defaultFill: "#991b1b", group: "frontArm", d: "M 60 155 L 30 148 L 28 135 L 52 142 Z" },
  { id: "frontArm_wrist", name: "Wrist Joint", type: "circle", defaultFill: "#7f1d1d", group: "frontArm", cx: 30, cy: 148, r: 7 },
  { id: "frontArm_claw1", name: "Arm Talon 1", type: "polygon", defaultFill: "#ffffff", group: "frontArm", points: "30,148 10,160 24,142" },
  { id: "frontArm_claw2", name: "Arm Talon 2", type: "polygon", defaultFill: "#ffffff", group: "frontArm", points: "32,150 14,164 26,144" },

  // 9. Head & Neck
  { id: "neck_base1", name: "Neck Segment 1", type: "path", defaultFill: "#7f1d1d", group: "headNeck", d: "M 70 125 Q 35 90 30 55 Q 15 30 52 18 Q 80 38 86 102 Z" },
  { id: "neck_base2", name: "Neck Segment 2", type: "path", defaultFill: "#991b1b", group: "headNeck", d: "M 35 90 Q 30 55 15 30 Q 30 35 48 60 Z" },
  { id: "neck_plate1", name: "Neck Plate 1", type: "path", defaultFill: "#580e0e", group: "headNeck", d: "M 28 50 C 44 42 60 48 68 56 C 54 62 38 58 28 50 Z" },
  { id: "neck_plate2", name: "Neck Plate 2", type: "path", defaultFill: "#450a0a", group: "headNeck", d: "M 32 64 C 48 56 64 62 72 70 C 58 76 42 72 32 64 Z" },
  { id: "neck_plate3", name: "Neck Plate 3", type: "path", defaultFill: "#310606", group: "headNeck", d: "M 36 78 C 52 70 68 76 76 84 C 62 90 46 86 36 78 Z" },
  { id: "mouth_cavity", name: "Throat Cavity Backfill", type: "path", defaultFill: "#220303", group: "headNeck", d: "M 32 20 L -10 15 L -16 28 L 8 40 L 32 30 Z" },
  { id: "skull_base", name: "Skull Core base", type: "path", defaultFill: "#991b1b", group: "headNeck", d: "M 48 20 L -24 5 L 8 -10 L 62 8 Z" },
  { id: "mouth_webbing", name: "Mouth Flap Webbing", type: "path", defaultFill: "#b91c1c", group: "headNeck", d: "M 28 20 Q 20 28 8 36 Q 22 38 28 20 Z" },
  { id: "snout_base", name: "Snout structure", type: "polygon", defaultFill: "#7f1d1d", group: "headNeck", points: "-24,5 -8,-1 5,-7 -17,0" },
  { id: "snout_nostril", name: "Nostril Cavity", type: "ellipse", defaultFill: "#260404", group: "headNeck", cx: -12, cy: 2, rx: 4, ry: 2.2 },
  { id: "lower_jaw", name: "Lower Jawbone", type: "path", defaultFill: "#7f1d1d", group: "headNeck", d: "M 38 34 L -26 18 L 8 42 Z" },
  
  // Upper fangs
  { id: "upper_fang1", name: "Upper Fang 1", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-16,7 -22,14 -11,9" },
  { id: "upper_fang2", name: "Upper Fang 2", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-10,8 -14,16 -5,10" },
  { id: "upper_fang3", name: "Upper Fang 3", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-4,9 -8,17 1,11" },
  { id: "upper_fang4", name: "Upper Fang 4", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "2,10 0,18 7,12" },
  { id: "upper_fang5", name: "Upper Fang 5", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "8,11 6,19 13,13" },
  { id: "upper_fang6", name: "Upper Fang 6", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "14,12 12,20 19,14" },
  
  // Lower fangs
  { id: "lower_fang1", name: "Lower Fang 1", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-20,20 -14,12 -15,22" },
  { id: "lower_fang2", name: "Lower Fang 2", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-12,22 -7,14 -7,24" },
  { id: "lower_fang3", name: "Lower Fang 3", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "-4,24 1,16 1,26" },
  { id: "lower_fang4", name: "Lower Fang 4", type: "polygon", defaultFill: "#ffffff", group: "headNeck", points: "3,26 8,18 8,28" },

  // Horns & Head spines
  { id: "horn1", name: "Main Lightning Horn (Left)", type: "path", defaultFill: "#260404", group: "headNeck", d: "M 42 6 L 64 -12 L 54 -14 L 82 -32 L 58 -18 L 66 -16 Z" },
  { id: "horn2", name: "Under Lightning Horn (Right)", type: "path", defaultFill: "#7f1d1d", group: "headNeck", d: "M 37 2 L 59 -16 L 49 -18 L 77 -36 L 53 -22 L 61 -20 Z" },
  { id: "spine_head1", name: "Crest Horn Plate 1", type: "polygon", defaultFill: "#7f1d1d", group: "headNeck", points: "42,8 55,-4 58,10" },
  { id: "spine_head2", name: "Crest Horn Plate 2", type: "polygon", defaultFill: "#991b1b", group: "headNeck", points: "30,18 12,14 26,26" },
  { id: "spine_head3", name: "Crest Horn Plate 3", type: "polygon", defaultFill: "#450a0a", group: "headNeck", points: "38,16 22,8 34,22" },

  // Eye
  { id: "eye_base", name: "Eye Iris", type: "ellipse", defaultFill: "#f59e0b", group: "headNeck", cx: 28, cy: 4, rx: 8, ry: 5 },
  { id: "eye_pupil", name: "Eye Slit Pupil", type: "polygon", defaultFill: "#000000", group: "headNeck", points: "28,-1 30,4 28,9 26,4" },
  { id: "eye_specular", name: "Eye Light Specular", type: "circle", defaultFill: "#ffffff", group: "headNeck", cx: 25, cy: 2, r: 1.8 },
  { id: "eye_brow", name: "Eyebrow Plate", type: "polygon", defaultFill: "#260404", group: "headNeck", points: "18,-2 38,0 36,3 20,1" },

  // 11. Front Claw
  { id: "frontClaw_arm", name: "Rigged Claw Arm", type: "path", defaultFill: "#991b1b", group: "frontClaw", d: "M 85 115 L 50 148 L 30 140 Q 60 110 85 115 Z" },
  { id: "frontClaw_claw1", name: "Claw Talon 1", type: "polygon", defaultFill: "#ffffff", group: "frontClaw", points: "30,140 15,150 27,136" },
  { id: "frontClaw_claw2", name: "Claw Talon 2", type: "polygon", defaultFill: "#ffffff", group: "frontClaw", points: "33,143 19,154 30,139" },
  { id: "frontClaw_claw3", name: "Claw Talon 3", type: "polygon", defaultFill: "#ffffff", group: "frontClaw", points: "36,146 23,157 33,142" },
];

// Split path or polygon coordinate string into tokens and pairs
export function parseCoordinates(str: string) {
  if (!str) return { tokens: [], coordinates: [] };
  const tokens = str.split(/(-?\d+(?:\.\d+)?)/);
  const coordinates: { x: number; y: number; xIdx: number; yIdx: number }[] = [];
  
  let numCount = 0;
  let xVal = 0;
  let xIdx = -1;
  
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 1) { // odd index is a parsed number token
      const val = parseFloat(tokens[i]);
      if (numCount % 2 === 0) {
        xVal = val;
        xIdx = i;
      } else {
        coordinates.push({
          x: xVal,
          y: val,
          xIdx: xIdx,
          yIdx: i,
        });
      }
      numCount++;
    }
  }
  return { tokens, coordinates };
}

type LandscapeDragonProps = {
  bossHpPercent: number; // 0 to 100
  isDefeated: boolean;
  offsets?: Record<string, { x: number; y: number; rotate: number; scale?: number }>;
  onSelectPart?: (partId: string) => void;
  selectedPart?: string | null;
  animationsEnabled?: boolean;
  customShapes?: CustomShape[];
  fills?: Record<string, string>;
  deletedShapes?: Record<string, boolean>;
  onStartDragShape?: (shapeId: string, clientX: number, clientY: number) => void;
  geometries?: Record<string, string>;
  onStartDragNode?: (shapeId: string, xIdx: number, yIdx: number, startX: number, startY: number, mouseX: number, mouseY: number) => void;
  layerOrder?: string[];
};

export function LandscapeDragon({
  bossHpPercent,
  isDefeated,
  offsets = {},
  onSelectPart,
  selectedPart,
  animationsEnabled = true,
  customShapes = [],
  fills = {},
  deletedShapes = {},
  onStartDragShape,
  geometries = {},
  onStartDragNode,
  layerOrder = [],
}: LandscapeDragonProps) {
  const damageClearedFraction = (100 - bossHpPercent) / 100;
  const dragonX = 580 + damageClearedFraction * 60;

  // Build list of shapes dynamically in layer order
  const sortedShapes = React.useMemo(() => {
    const originalMap = new Map(DRAGON_ORIGINAL_SHAPES.map(s => [s.id, s]));
    const customMap = new Map(customShapes.map(s => [s.id, {
      id: s.id,
      name: s.name,
      type: s.type,
      defaultFill: s.fill,
      d: s.d,
      points: s.points,
      cx: s.x,
      cy: s.y,
      r: s.rx,
      rx: s.rx,
      ry: s.ry,
      width: s.width,
      height: s.height,
      x: s.x,
      y: s.y,
    } as OriginalShape]));

    // If layerOrder is empty, fallback to original shapes order
    const order = layerOrder.length > 0 ? layerOrder : [
      ...customShapes.map(s => s.id),
      ...DRAGON_ORIGINAL_SHAPES.map(s => s.id)
    ];

    return order.map(id => originalMap.get(id) || customMap.get(id)).filter(Boolean) as OriginalShape[];
  }, [layerOrder, customShapes]);

  // Build individual element props (coordinates, select handles, drag handles, fills)
  function getShapeProps(shapeId: string, defaultFill?: string, defaultStroke?: string, defaultStrokeWidth?: number) {
    const isSelected = selectedPart === shapeId;
    const offset = offsets[shapeId] || { x: 0, y: 0, rotate: 0, scale: 1 };
    const scaleVal = offset.scale ?? 1;

    let tx = offset.x;
    let ty = offset.y;
    let baseRot = 0;

    if (shapeId.startsWith("custom_")) {
      const customShapeObj = customShapes.find(s => s.id === shapeId);
      if (customShapeObj) {
        tx += customShapeObj.x;
        ty += customShapeObj.y;
        baseRot += customShapeObj.rotate ?? 0;
      }
    }
    
    return {
      fill: fills[shapeId] ?? defaultFill,
      onClick: (e: React.MouseEvent) => {
        if (onSelectPart) {
          e.stopPropagation();
          onSelectPart(shapeId);
        }
      },
      onMouseDown: (e: React.MouseEvent) => {
        if (e.shiftKey && onStartDragShape) {
          e.preventDefault();
          e.stopPropagation();
          if (onSelectPart) onSelectPart(shapeId);
          onStartDragShape(shapeId, e.clientX, e.clientY);
        }
      },
      style: {
        cursor: onSelectPart ? "pointer" : "inherit",
        pointerEvents: (onSelectPart ? "auto" : "none") as any,
      },
      stroke: isSelected ? "#ffd700" : defaultStroke,
      strokeWidth: isSelected ? 3 : defaultStrokeWidth,
      transform: `translate(${tx}, ${ty}) rotate(${(offset.rotate ?? 0) + baseRot}) scale(${scaleVal})`,
    };
  }

  return (
    <div
      className="landscape-layer layer-8-dragon"
      style={{ pointerEvents: (onSelectPart ? "auto" : "none") as any }}
      aria-label={`Epic Rigged Western Red Dragon (${bossHpPercent}% HP left)`}
    >
      <style>{`
        @keyframes dragon-slain-fall {
          0% { transform: translateY(0); opacity: 0.95; }
          50% { transform: translateY(12px); opacity: 0.7; }
          100% { transform: translateY(20px); opacity: 0.55; }
        }
        @keyframes dragon-ghost-soul {
          0% { transform: translateY(0) scale(0.85); opacity: 0; }
          50% { transform: translateY(-25px) scale(1.05); opacity: 0.85; }
          100% { transform: translateY(-55px) scale(1.2); opacity: 0; }
        }
        .dragon-defeated-anim {
          animation: dragon-slain-fall 2s ease-in-out forwards;
          filter: drop-shadow(0 0 10px #60a5fa);
        }
      `}</style>
      <svg
        viewBox="0 0 1000 400"
        width="100%"
        height="100%"
        style={{ pointerEvents: (onSelectPart ? "auto" : "none") as any }}
      >
        {/* Dragon Group anchored on Far-Right End */}
        <g
          transform={`translate(${dragonX}, 130)`}
          className="dragon-group"
        >
          <g className={isDefeated ? "dragon-defeated-anim" : ""}>
            {/* Defeated Ghost Soul and Slayed Indicator */}
            {isDefeated && (
              <g transform="translate(100, -20)" style={{ animation: "dragon-ghost-soul 3s ease-in-out infinite", pointerEvents: "none" }}>
                <text x="0" y="0" fill="#94a3b8" fontSize="18" fontWeight="900" fontFamily="var(--font-heading), sans-serif" textAnchor="middle" opacity="0.85">
                  Slayed Boss
                </text>
                <polygon points="0,-15 5,-5 15,0 5,5 0,15 -5,5 -15,0 -5,-5" fill="#38bdf8" opacity="0.7" />
                <polygon points="-25,-25 -15,-20 -20,-10" fill="#facc15" opacity="0.6" />
                <polygon points="25,-30 20,-15 35,-20" fill="#f43f5e" opacity="0.6" />
              </g>
            )}

          {/* Dragon Ground Shadow (Grounded directly under dragon body/feet, never cropped) */}
          <g transform="translate(85, 180)">
            {!isDefeated && animationsEnabled && (
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1; 0.92; 1"
                dur="3.2s"
                repeatCount="indefinite"
                additive="sum"
              />
            )}
            <ellipse cx="0" cy="0" rx="105" ry="22" fill="rgba(0,0,0,0.22)" stroke="none" />
          </g>

          {/* Hovering animation tag */}
          <g>
            {!isDefeated && animationsEnabled && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,-14; 0,0"
                dur="3.2s"
                repeatCount="indefinite"
              />
            )}

            {/* --- MASTER-LEVEL ANATOMICAL DRAGON --- */}
            <g transform="scale(0.68)">
              {sortedShapes.map((shape) => {
                if (deletedShapes[shape.id]) return null;

                // Resolve current geometry path or polygon string
                const geom = geometries[shape.id] || shape.d || shape.points || "";

                // Node information handles for selected element
                const isSelected = selectedPart === shape.id;
                const nodeInfo = isSelected && (shape.type === "path" || shape.type === "polygon")
                  ? parseCoordinates(geom)
                  : null;

                let element: React.ReactElement | null = null;
                const fillVal = fills[shape.id] ?? shape.defaultFill;

                switch (shape.type) {
                  case "path":
                    element = <path d={geom} {...getShapeProps(shape.id, shape.defaultFill)} />;
                    break;
                  case "polygon":
                    element = <polygon points={geom} {...getShapeProps(shape.id, shape.defaultFill)} />;
                    break;
                  case "circle":
                    element = <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...getShapeProps(shape.id, shape.defaultFill)} />;
                    break;
                  case "ellipse":
                    element = <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...getShapeProps(shape.id, shape.defaultFill)} />;
                    break;
                  case "rect":
                    element = <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} ry={shape.ry} {...getShapeProps(shape.id, shape.defaultFill)} />;
                    break;
                  default:
                    return null;
                }

                // Wrap element inside Wing Flapping animation transform if needed
                if (shape.group === "backWing") {
                  element = (
                    <g transform-origin="120 110">
                      {animationsEnabled && (
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0; -45; 15; 0"
                          dur="1.8s"
                          repeatCount="indefinite"
                          additive="sum"
                        />
                      )}
                      {element}
                    </g>
                  );
                } else if (shape.group === "frontWing") {
                  element = (
                    <g transform-origin="110 115">
                      {animationsEnabled && (
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0; 45; -15; 0"
                          dur="1.8s"
                          repeatCount="indefinite"
                          additive="sum"
                        />
                      )}
                      {element}
                    </g>
                  );
                }

                // Render both the shape and its blue drag handles on top
                const offset = offsets[shape.id] || { x: 0, y: 0, rotate: 0, scale: 1 };
                const scaleVal = offset.scale ?? 1;

                let tx = offset.x;
                let ty = offset.y;
                let baseRot = 0;

                if (shape.id.startsWith("custom_")) {
                  tx += shape.x ?? 0;
                  ty += shape.y ?? 0;
                  baseRot += (shape as any).rotate ?? 0;
                }

                const baseTransform = `translate(${tx}, ${ty}) rotate(${((offset.rotate ?? 0) + baseRot)}) scale(${scaleVal})`;

                return (
                  <g key={shape.id}>
                    {element}

                    {/* Nodes (Blue handles) positioned on top of the shape */}
                    {isSelected && nodeInfo && (
                      <g
                        transform={baseTransform}
                        style={{ pointerEvents: "auto" }}
                      >
                        {/* Wrap nodes in wing animations too so they rotate together */}
                        {(() => {
                          const nodesMarkup = nodeInfo.coordinates.map((coord) => (
                            <circle
                              key={`node-${coord.xIdx}`}
                              cx={coord.x}
                              cy={coord.y}
                              r={4.5}
                              fill="#38bdf8"
                              stroke="#ffffff"
                              strokeWidth={1.5}
                              style={{ cursor: "move", pointerEvents: "auto" }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (onStartDragNode) {
                                  onStartDragNode(
                                    shape.id,
                                    coord.xIdx,
                                    coord.yIdx,
                                    coord.x,
                                    coord.y,
                                    e.clientX,
                                    e.clientY
                                  );
                                }
                              }}
                            />
                          ));

                          if (shape.group === "backWing") {
                            return (
                              <g transform-origin="120 110">
                                {animationsEnabled && (
                                  <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    values="0; -45; 15; 0"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                    additive="sum"
                                  />
                                )}
                                {nodesMarkup}
                              </g>
                            );
                          } else if (shape.group === "frontWing") {
                            return (
                              <g transform-origin="110 115">
                                {animationsEnabled && (
                                  <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    values="0; 45; -15; 0"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                    additive="sum"
                                  />
                                )}
                                {nodesMarkup}
                              </g>
                            );
                          }
                          return nodesMarkup;
                        })()}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      </g>
      </svg>
    </div>
  );
}
import React from "react";
