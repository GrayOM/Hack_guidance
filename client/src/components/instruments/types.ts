/** What every instrument is handed: which node it stands in, the trace to plant, and the four
 *  callbacks through which it reports back to the node screen. */
export type InstrumentProps = {
  surface: string;
  stageId: number;
  nodeKey: string;
  actionLabel?: string;
  target: string;
  trace: string;
  onLog: (lines: string[]) => void;
  onBusy: () => void;
  onDone: () => void;
  onRemote: (mode: string) => Promise<void>;
  onRoute: () => void;
};
