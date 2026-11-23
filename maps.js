// Points are world units, ordered west to east. Shared stretches use identical
// coordinates so road art, crowd movement, and building all see the same fork.
const maps = {
  meadow: {
    name: 'Clover Meadow', setting: 'Meadow', size: 'Compact', width: 820, height: 480,
    briefing: 'Start here. One winding road brings every walker past the central bend.',
    widths: [88, 84, 80, 74, 82, 84, 84],
    paths: [[[-30,190],[125,190],[220,215],[330,298],[440,322],[555,297],[695,220],[786,220]]],
    landmarks: []
  },
  forest: {
    name: 'Blackpine Hollow', setting: 'Forest', size: 'Mid-size', width: 980, height: 680,
    briefing: 'A short ridge trail and a sweeping forest road meet at the eastern clearing.',
    widths: [94, 82, 68, 70, 76, 80, 86],
    paths: [
      [[-30,400],[158,400],[290,296],[442,178],[602,158],[722,226],[842,296],[946,296]],
      [[-30,400],[158,400],[326,435],[460,526],[592,508],[706,390],[842,296],[946,296]]
    ],
    landmarks: []
  },
  quarry: {
    name: 'Redstone Quarry', setting: 'Quarry', size: 'Wide', width: 1180, height: 570,
    briefing: 'Three haul roads fan around the excavation. The middle cut is the fastest approach.',
    widths: [90, 82, 65, 58, 72, 72, 84],
    paths: [
      [[-30,292],[160,292],[315,180],[480,95],[655,92],[825,150],[1000,266],[1146,266]],
      [[-30,292],[160,292],[335,265],[485,245],[643,265],[824,305],[1000,266],[1146,266]],
      [[-30,292],[160,292],[322,399],[480,475],[666,470],[865,384],[1000,266],[1146,266]]
    ],
    landmarks: [[570,170,68,25],[515,362,108,35],[727,367,45,23],[935,80,78,31],[174,485,94,36]]
  },
  town: {
    name: 'Bellwether Ruins', setting: 'Ruined town', size: 'Large', width: 1160, height: 820,
    briefing: 'Four streets leave the old market. Build in the vacant lots or guard the eastern junction.',
    widths: [92, 82, 60, 60, 66, 70, 84],
    paths: [
      [[-30,405],[172,405],[285,245],[412,118],[648,118],[788,169],[982,405],[1126,405]],
      [[-30,405],[172,405],[330,340],[438,301],[628,301],[783,288],[982,405],[1126,405]],
      [[-30,405],[172,405],[320,470],[460,500],[620,500],[798,528],[982,405],[1126,405]],
      [[-30,405],[172,405],[306,595],[426,678],[648,678],[795,627],[982,405],[1126,405]]
    ],
    // Ruin bounds use center and half-extents. Vacant blocks remain buildable.
    landmarks: [[105,151,46,31],[190,203,28,24],[512,207,48,26],[641,207,32,22],
      [442,397,33,28],[585,402,47,28],[722,415,32,20],[479,591,44,22],
      [641,591,39,24],[1008,172,52,33],[1017,614,51,29],[213,701,39,34],[722,753,43,19]]
  },
  marsh: {
    name: 'Saltmarsh Delta', setting: 'Wetlands', size: 'Expansive', width: 1450, height: 750,
    briefing: 'Two causeways split again around tidal pools. Four narrow crossings return to a single levee.',
    widths: [92, 82, 76, 64, 63, 64, 74, 84, 90],
    paths: [
      [[-30,378],[183,378],[342,294],[464,228],[657,111],[802,97],[977,216],[1112,285],[1274,378],[1416,378]],
      [[-30,378],[183,378],[342,294],[464,228],[641,274],[798,300],[977,216],[1112,285],[1274,378],[1416,378]],
      [[-30,378],[183,378],[348,457],[514,518],[694,443],[826,426],[1032,520],[1148,459],[1274,378],[1416,378]],
      [[-30,378],[183,378],[348,457],[514,518],[682,619],[828,646],[1032,520],[1148,459],[1274,378],[1416,378]]
    ],
    landmarks: [[745,190,70,30],[750,535,82,32],[619,370,103,34],[208,142,100,38],
      [173,570,96,43],[1150,125,105,45],[1241,599,85,39],[945,349,60,25]]
  }
};
