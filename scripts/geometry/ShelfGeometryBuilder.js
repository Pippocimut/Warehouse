import * as THREE from 'three';
import * as BufferGeometryUtils from './BufferGeometryUtils';
import { animate } from '../../main';

/***********************************************/
/************ CLASSE BIN *********************/
/***********************************************/

class Bin {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.content = null; // Contenuto del bin (oggetto tridimensionale)
        this.isEmpty = true; // Flag per indicare se il bin è vuoto o meno
    }
}

/***********************************************/
/******** CLASSE GEOMETRIA SCAFFALATURA ********/
/***********************************************/

/**
 * @class ShelfGeometryBuilder Rappresenta e costruisce la geometria della scaffalatura in 3-dimensioni con profondità massima di 1 [bin] e statica
 */
class ShelfGeometryBuilder {
    #_binCols;
    #_binRows;
    #_width;
    #_height;
    #_rotation;

    #_bins = [];
    /**
	 * @type {THREE.BufferGeometry}
	 */
    #_geometry = null;

    static #_maxWidth = Number.POSITIVE_INFINITY;
    static #_maxHeight = Number.POSITIVE_INFINITY;
    static #_binDimensions = {
        width: 2,
        height: 2,
        depth: 2
    };
    static #_planeHeight = 0.2;
    static #_legWidth = 0.2;
    static #_legDepth = 0.2;

    /**
     * 
     * @param {number} binCols Numero di colonne della scaffalatura in [bin]
     * @param {number} binRows Numero di righe della scaffalatura in [bin]
     */
    constructor(binCols, binRows) {
        this.#_setupDimensions(binCols, binRows);
        this.#_buildGeometry();
        this.#_initializeBins()
    }

    /**
     * Imposta le dimensioni della scaffalatura a partire dai parametri indicati
     * @param {number} binCols Numero di colonne della scaffalatura in [bin]
     * @param {number} binRows Numero di righe della scaffalatura in [bin]
     */
    #_setupDimensions(binCols, binRows) {
        if(binCols <= 0 || binRows <= 0) {
            throw new Error("Dimensioni impossibili per scaffalatura");
        }
        this.#_rotation = 0;
        this.#_binCols = binCols;
        this.#_binRows = binRows;
        this.#_width = this.#_binCols * ShelfGeometryBuilder.#_binDimensions.width;
        this.#_height = this.#_binRows * ShelfGeometryBuilder.#_binDimensions.height + ShelfGeometryBuilder.#_planeHeight;
        if(this.#_width > ShelfGeometryBuilder.#_maxWidth || this.#_height > ShelfGeometryBuilder.#_maxHeight) {
            throw new Error("Le dimensioni per la scaffalatura eccedono i massimi valori impostati");
        }
    }

    #_initializeBins() {
        for (let i = 0; i < this.#_binCols; i++) {
            this.#_bins[i] = [];
            for (let j = 0; j < this.#_binRows; j++) {
                this.#_bins[i][j] = new Bin(ShelfGeometryBuilder.#_binDimensions.width, ShelfGeometryBuilder.#_binDimensions.height, ShelfGeometryBuilder.#_binDimensions.depth);
            }
        }
    }

    /**
	 * Costruisce la figura 3D della scaffalatura
	 */
    #_buildGeometry() {
        let depth = ShelfGeometryBuilder.#_binDimensions.depth;
        this.#_rotation = 0;

        let geometriesArray = [];
        for (let index = 0; index < this.#_binRows+1; index++) {
            // Adding plane geometry
            geometriesArray[index] = new THREE.BoxGeometry( this.#_width, ShelfGeometryBuilder.#_planeHeight, depth );
            geometriesArray[index].translate(0,ShelfGeometryBuilder.#_binDimensions.height * index + ShelfGeometryBuilder.#_planeHeight / 2,0);
        }
		
        const frontLeftLegGeo = new THREE.BoxGeometry( ShelfGeometryBuilder.#_legWidth, this.#_height, ShelfGeometryBuilder.#_legDepth );
        frontLeftLegGeo.translate(-(this.#_width / 2 - ShelfGeometryBuilder.#_legWidth), (this.#_height / 2), (depth / 2 - ShelfGeometryBuilder.#_legDepth));
        geometriesArray.push(frontLeftLegGeo);

        const frontRightLegGeo = new THREE.BoxGeometry( ShelfGeometryBuilder.#_legWidth, this.#_height, ShelfGeometryBuilder.#_legDepth );
        frontRightLegGeo.translate((this.#_width / 2 - ShelfGeometryBuilder.#_legWidth), (this.#_height / 2), (depth / 2 - ShelfGeometryBuilder.#_legDepth));
        geometriesArray.push(frontRightLegGeo);

        const backLeftLegGeo = new THREE.BoxGeometry( ShelfGeometryBuilder.#_legWidth, this.#_height, ShelfGeometryBuilder.#_legDepth );
        backLeftLegGeo.translate(-(this.#_width / 2 - ShelfGeometryBuilder.#_legWidth), (this.#_height / 2), -(depth / 2 - ShelfGeometryBuilder.#_legDepth));
        geometriesArray.push(backLeftLegGeo);

        const backRightLegGeo = new THREE.BoxGeometry( ShelfGeometryBuilder.#_legWidth, this.#_height, ShelfGeometryBuilder.#_legDepth );
        backRightLegGeo.translate((this.#_width / 2 - ShelfGeometryBuilder.#_legWidth), (this.#_height / 2), -(depth / 2 - ShelfGeometryBuilder.#_legDepth));
        geometriesArray.push(backRightLegGeo);

        this.#_geometry = BufferGeometryUtils.mergeGeometries(geometriesArray);
    }

    /**
     * Inserisce un oggetto in un bin specifico della scaffalatura
     * @param {THREE.Object3D} object L'oggetto da inserire nel bin
     */
    insertObjectInBin(object, mesh, posx, posy) {


        const row = posx;
        const column = posy;
        // Trova un bin casuale libero all'interno della scaffalatura
        //const randomColumnIndex = Math.floor(Math.random() * this.#_binCols);
        //const randomRowIndex = Math.floor(Math.random() * this.#_binRows);
        const bin = this.#_bins[row][column];
    
        // Controlla se il bin è vuoto
        if (!bin.isEmpty) {
            console.error("Il bin selezionato non è vuoto.");
            return;
        }

        // Imposta l'oggetto come contenuto del bin
        bin.content = object;
        bin.isEmpty = false;
        object.assignBin(this, row, column);
    
        // Posiziona l'oggetto correttamente all'interno della scaffalatura
        let xPosition;
        let yPosition;
        let zPosition;
        console.log(this.#_rotation);
        switch (this.#_rotation){
            case 0:
                xPosition = mesh.position.x + ((0 + 0.5 - this.#_binCols / 2 + row) * ShelfGeometryBuilder.#_binDimensions.width);
                yPosition = ShelfGeometryBuilder.#_planeHeight + object.mesh.geometry.parameters.height / 2 + column * ShelfGeometryBuilder.#_binDimensions.height;
                zPosition = mesh.position.z;
                break;
            case Math.PI / 2:
                xPosition = mesh.position.x;
                yPosition = ShelfGeometryBuilder.#_planeHeight + object.mesh.geometry.parameters.height / 2 + column * ShelfGeometryBuilder.#_binDimensions.height;
                zPosition = mesh.position.z + ((0 + 0.5 - this.#_binCols / 2 + row) * ShelfGeometryBuilder.#_binDimensions.width);
                break;
            default:
                console.error("Rotazione non valida.");
                break;
        }
    
        object.mesh.position.set(xPosition, yPosition, zPosition);
    }

    insertObjectInRandomBin(object, mesh) {
        // Trova un bin casuale libero all'interno della scaffalatura
        let hasFreeSlot = false;
        for(let i = 0; i < this.#_binCols; i++) {
            for(let j = 0; j < this.#_binRows; j++) {
                if(this.#_bins[i][j].isEmpty) {
                    hasFreeSlot = true;
                }
            }
        }
        if(!hasFreeSlot) {
            alert("Non ci sono slot liberi nella scaffalatura.");
            return;
        }

        let randomColumnIndex;
        let randomRowIndex;

        do {
            randomColumnIndex = Math.floor(Math.random() * this.#_binCols);
            randomRowIndex = Math.floor(Math.random() * this.#_binRows);
        } while(!this.#_bins[randomColumnIndex][randomRowIndex].isEmpty);

        this.insertObjectInBin(object, mesh, randomColumnIndex, randomRowIndex);
    }

    /**
     * Rimuovere la scaffalatura
     * @param {Object} object - Scaffalatura da rimuovere
     */
    
    
    removeShelf() {
        for(let i = 0; i < this.#_binCols; i++) {
            for(let j = 0; j < this.#_binRows; j++) {
                if(this.#_bins[i][j].isEmpty == false) {
                    return false;
                }
            }
        }

        if (this.#_geometry !== null) {
            this.#_geometry.dispose();
            this.#_geometry = null;
            return true
        }
        return true
    }

    
    /**
     * Effettua il controllo sulla presenza o meno dei prodotti sui bin e effettua lo spostamento alla posizione corretta
     */
    updateProductBin(mesh){
        //metto da parte il prodotto da spostare e svuoto il bin
        //alert("prova2");
        for (let i = 0; i < this.#_binCols; i++) {
            //this.#_bins[i] = [];
            for (let j = 0; j < this.#_binRows; j++) {
                if(this.#_bins[i][j].isEmpty == false ){
                    let obj1=this.#_bins[i][j].content;
                    this.#_bins[i][j].isEmpty = true;
                    this.insertObjectInBin(obj1, mesh, obj1.binx, obj1.biny);
                    this.updateContent();
                }
            }
        }
        //alert("prova3");
    }

    rotateShelf(direction) {

        if (direction === "clockwise") {
            this.#_rotation -= Math.PI / 2;
        } else if (direction === "counterclockwise") {
            this.#_rotation += Math.PI / 2;
        } else {
            console.error("Direzione di rotazione non valida.");
            return;
        }
        
        this.#_rotation = Math.abs(this.#_rotation);
        this.#_rotation = this.#_rotation % (Math.PI);
    }



    /**
     * Rimuove l'oggetto da un bin specifico
     * @param {Object} object - L'oggetto da rimuovere dal bin
     * @param {number} row - Indice della riga del bin
     * @param {number} column - Indice della colonna del bin
     */
    removeObjectFromBin(object, row, column) {
        const bin = this.#_bins[row][column];
        
        // Verifica se il bin contiene l'oggetto specificato
        if (bin.isEmpty || bin.content !== object) {
            console.error("Il bin specificato non contiene l'oggetto specificato.");
            return;
        }

        // Rimuovi l'oggetto dal bin
        bin.content = null;
        bin.isEmpty = true;
    }
    
    /**
     * Ottiene il bin alla posizione specificata.
     * @param {number} row - Indice della riga del bin
     * @param {number} column - Indice della colonna del bin
     * @returns {Object|null} - Il bin alla posizione specificata, null se non trovato
     */
    getBinAt(row, column) {
        // Verifica se le coordinate specificate sono valide
        if (row < 0 || row >= this.#_binRows || column < 0 || column >= this.#_binCols) {
            console.error("Coordinate del bin non valide.");
            return null;
        }
        
        return this.#_bins[row][column];
    }

    updateContent(){
        for (let i = 0; i < this.#_binCols; i++) {
            for (let j = 0; j < this.#_binRows; j++) {
                if(this.#_bins[i][j].content != null){
                    if(this.#_bins[i][j].content.shelf != this || this.#_bins[i][j].content.binx != i || this.#_bins[i][j].content.biny != j){
                        this.#_bins[i][j].content = null;
                        this.#_bins[i][j].isEmpty = true;
                    }
                }
            }
        }
    }

    getRows() {
        return this.#_binRows;
    }

    getCols() {
        return this.#_binCols;
    }

    getRotation() {
        return this.#_rotation;
    }

    /**
     * @returns {THREE.BufferGeometry}
     */
    get geometry() {
        return this.#_geometry;
    }

    /**
     * @returns {number}
     */
    get width() {
        return this.#_width;
    }

    /**
     * @returns {number}
     */
    get height() {
        return this.#_height;
    }

    
    /**
     * @returns {number}
     */
    static get depth() {
        return ShelfGeometryBuilder.#_binDimensions.depth;
    }

    /**
     * @returns {number}
     */
    static get maxWidth() {
        return ShelfGeometryBuilder.#_maxWidth;
    }

    /**
     * @returns {number}
     */
    static get maxHeight() {
        return ShelfGeometryBuilder.#_maxHeight;
    }

    /**
     * @param {number} value Valore da impostare come massima lunghezza
     */
    static set maxWidth(value) {
        ShelfGeometryBuilder.#_maxWidth = value;
    }

    /**
     * @param {number} value Valore da impostare come massima altezza
     */
    static set maxHeight(value) {
        ShelfGeometryBuilder.#_maxHeight = value;
    }

    /**
     * @param {number} value Valore da impostare come lunghezza del bin
     */
    static set binWidth(value) {
        ShelfGeometryBuilder.#_binDimensions.width = value;
    }

    /**
     * @param {number} value Valore da impostare come altezza del bin
     */
    static set binHeight(value) {
        ShelfGeometryBuilder.#_binDimensions.height = value;
    }

    /**
     * @param {number} value Valore da impostare come profondità del bin
     */
    static set binDepth(value) {
        ShelfGeometryBuilder.#_binDimensions.depth = value;
    }
}

export { ShelfGeometryBuilder }