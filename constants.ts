
import { NodeInfo } from './types';

export const AOC_NODES: NodeInfo[] = [
  { id: '1', name: 'Aela', region: 'The Riverlands' },
  { id: '2', name: 'Dünheim', region: 'The Mountains' },
  { id: '3', name: 'Garen', region: 'The Riverlands' },
  { id: '4', name: 'Oakhaven', region: 'The Forest' },
  { id: '5', name: 'Rivers End', region: 'The Riverlands' },
  { id: '6', name: 'Whitepeak', region: 'The Mountains' },
  { id: '7', name: 'Carphin', region: 'The Swamps' },
  { id: '8', name: 'Verra', region: 'The Coast' },
  { id: '9', name: 'Heartwood', region: 'The Forest' },
  { id: '10', name: 'Sandstone', region: 'The Desert' },
  { id: '11', name: 'Frostfall', region: 'Tundra' },
  { id: '12', name: 'Ironhold', region: 'Mountains' },
  { id: '13', name: 'Seabrash', region: 'Coast' },
  { id: '14', name: 'Marshgate', region: 'Swamps' },
  { id: '15', name: 'Highcliff', region: 'Cliffs' }
].sort((a, b) => a.name.localeCompare(b.name));

export const STORAGE_KEY = 'aoc_trade_history';
