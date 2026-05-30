export interface IotData {
  suhu: number;
  kelembapan: number;
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
}

export interface RelayLabels {
  relay1Name: string;
  relay2Name: string;
  relay3Name: string;
  relay4Name: string;
}

export interface VoiceCommandLog {
  id: string;
  timestamp: string;
  commandText: string;
  action: "TOGGLE_RELAY" | "SET_ALL_RELAYS" | "GET_STATUS" | "UNKNOWN" | "ERROR";
  interpretedDetails: {
    relayNumber: number | null;
    value: boolean | null;
    speechResponse: string;
  };
  success: boolean;
}

export interface ReadingHistory {
  timestamp: string;
  suhu: number;
  kelembapan: number;
}
