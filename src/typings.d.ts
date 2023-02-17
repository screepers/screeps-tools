interface CellMap {
    [y: number]: {
        [x: number]: number
    }
}

interface BuildingPlannerProps extends React.Component {
    state: {
        room: string;
        world: string;
        shard: string;
        terrain: CellMap;
        x: number;
        y: number;
        worlds: { [worldName: string]: { shards: string[] } };
        brush: string;
        rcl: number;
        structures: { [structure: string]: { x: number; y: number; }[] };
        sources: { x: number; y: number; }[];
        minerals: { mineralType: string, x: number; y: number }[];
        settings: {
            showStatsOverlay: boolean;
            allowBorderStructure: boolean;
        };
        scale: number;
    };

    resetState(): void;

    loadJson(json: any): any;

    paintCell(x: number, y: number): boolean;

    removeStructure(x: number, y: number, structure: string | null): void;

    removeResource(x: number, y: number): void;

    changeScale(e: any, decrease: boolean): void;

    setShowTowerDamage(on: boolean): void;
}

interface PlannerProps {
    planner: BuildingPlannerProps;
}

interface ModalProps {
    planner: BuildingPlannerProps;
    modal: boolean;
}

interface ModalImportRoomFormProps {
    planner: BuildingPlannerProps;
    room: string;
    world: string;
    shard: string;
    worlds: { [worldName: string]: { shards: string[] } };
    modal: boolean;
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
    text: string;
}