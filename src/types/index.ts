export interface CityCoords {
  lat: number;
  lng: number;
}

export interface Employee {
  id: string | number;
  name: string;
  email: string;
  city: string;
  salary: number | string;
  department?: string;
  phone?: string;
  age?: number | string;
  position?: string;
  joining_date?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  username: string;
  loggedInAt: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface VirtualizedState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

export interface CityData {
  city: string;
  totalSalary: number;
  avgSalary: number;
  count: number;
  lat: number;
  lng: number;
}

export interface MergedImageData {
  dataUrl: string;
  employeeId: string | number;
  capturedAt: number;
}