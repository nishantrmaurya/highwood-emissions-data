import { io, type Socket } from "socket.io-client";

const API_SOCKET_URL = "http://localhost:3000";

type SiteCreatedPayload = {
  id: number;
  site_name: string;
  site_type: string;
  created_at: string;
};

type MeasurementCreatedPayload = {
  id: number;
  site_id: number;
  measured_at: string;
  emission_value: number | string;
  unit: string;
  created_at: string;
};

export class RealtimeClient {
  private static instance: RealtimeClient | null = null;
  private socket: Socket | null = null;

  static getInstance(): RealtimeClient {
    if (!RealtimeClient.instance) {
      RealtimeClient.instance = new RealtimeClient();
    }

    return RealtimeClient.instance;
  }

  connect(): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(API_SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    return this.socket;
  }

  onSiteCreated(handler: (payload: SiteCreatedPayload) => void): () => void {
    const socket = this.connect();
    socket.on("site.created", handler);

    return () => {
      socket.off("site.created", handler);
    };
  }

  onMeasurementCreated(
    handler: (payload: MeasurementCreatedPayload) => void,
  ): () => void {
    const socket = this.connect();
    socket.on("measurement.created", handler);

    return () => {
      socket.off("measurement.created", handler);
    };
  }
}
