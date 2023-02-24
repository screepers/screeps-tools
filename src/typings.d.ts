/**
 * The import/export format for blueprint-planner.
 */
interface EncodedBlueprint {
    name?: string;
    shard?: string;
    rcl?: number;
    buildings: EncodedGameObjects;
    terrain?: {
        wall?: XY[],
        swamp?: XY[]
    };
    controller?: XY;
    sources?: XY[];
    mineral?: {
        x: number,
        y: number,
        mineralType: MineralConstant
    };
    annotations?: Record<string, XY[]>;
}

type EncodedGameObjects = Partial<{
    [key in StructureConstant]: XY[]
}>;

interface XY {
    x: number;
    y: number;
}

interface Rect {
    topLeft: XY;
    bottomRight: XY;
}

interface CellMap {
    [y: number]: {
        [x: number]: number
    }
}

interface BuildingPlannerProps extends React.Component {
    resetState(): void;

    importBlueprint(json: any): any;

    exportBlueprint(includeRoomFeatures: boolean): EncodedBlueprint;

    copyShareLink(includeRoomFeatures: boolean): void;

    paintCell(x: number, y: number): void;

    clearCell(x: number, y: number): void;

    changeScale(e: any, decrease: boolean): void;

    setSettings(settings: BuildingPlannerSettings): void;
}

interface ModalProps {
    planner: BuildingPlannerProps;
    modal: boolean;
}

interface ModalImportRoomFormProps extends ModalProps {
    room: string;
    world: string;
    shard: string;
    worlds: { [worldName: string]: { shards: string[] } };
}

interface ModalSettingsProps extends ModalProps {
    settings: BuildingPlannerSettings;
}

interface FieldValidation {
    value: string;
    validateOnChange: boolean;
    valid: boolean;
}

interface MapCellProps {
    x: number;
    y: number;
    terrain: number;
    planner: BuildingPlannerProps;
    structure: string | null;
    road: {
        middle: boolean;
        top: boolean;
        top_right: boolean;
        right: boolean;
        bottom_right: boolean;
        bottom: boolean;
        bottom_left: boolean;
        left: boolean;
        top_left: boolean;
    };
    rampart: boolean;
    source: boolean;
    mineral: string | null;
    selected: boolean;
    value?: number;
    text: string;
    textSize: number;
}

interface BuildingPlannerSettings {
    showStatsOverlay: boolean;
    allowBorderStructure: boolean;
    cellTextFontSize: number;
}