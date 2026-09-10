export interface CityLocation { id: string; name: string; district: string; position: [number, number, number] }
export const CITY_LOCATIONS: CityLocation[] = [
  {id:'park-east',name:'Maple Street and 4th Avenue',district:'Riverside Park',position:[53,0,13]},
  {id:'market-corner',name:'Corner Market, Grant Avenue',district:'Maple Market',position:[-29,0,-6.2]},
  {id:'civic-plaza',name:'City Plaza transit stop',district:'Civic Center',position:[30,0,-28]},
  {id:'cycle-crossing',name:'River Trail at East 4th Street',district:'Riverside Park',position:[36,0,5.8]},
  {id:'transit-shelter',name:'Station 68 transit shelter',district:'Station Quarter',position:[-23,0,28.5]},
];

export function getCityLocation(id: string): CityLocation {
  const location = CITY_LOCATIONS.find(item => item.id === id);
  if (!location) throw new Error(`Unknown SickCity location: ${id}`);
  return location;
}
