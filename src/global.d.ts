declare module "*.module.css" {
    const styles: Record<string, string>;
    export default styles;
}

declare module "cytoscape-cola" {
    import * as cytoscape from "cytoscape";
    const ext: cytoscape.Ext; 
    export default ext;
}
declare module "cytoscape-dagre" {
    import * as cytoscape from "cytoscape";
    const ext: cytoscape.Ext; 
    export default ext; 
}
declare module "cytoscape-elk" {
    import * as cytoscape from "cytoscape";
    const ext: cytoscape.Ext; 
    export default ext; 
}