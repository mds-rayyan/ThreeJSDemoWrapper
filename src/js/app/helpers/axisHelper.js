import * as THREE from 'three';

export default class AxisHelper {
  constructor(scene) {
    this.scene = scene;
    }

    add() {
        /*----------------------------------  Arrow Helper ------------------------------------*/

        // ARROW HELPER
        var xAxis = new THREE.ArrowHelper(
            // first argument is the direction
            new THREE.Vector3(2, 0, 0).normalize(),
            // second argument is the origin
            new THREE.Vector3(0, 0, 0),
            // length
            25,
            // ------ Blue color
            0x0000FF);
        this.scene.add(xAxis);

        // ARROW HELPER
        var yAxis = new THREE.ArrowHelper(
            // first argument is the direction
            new THREE.Vector3(0, 2, 0).normalize(),
            // second argument is the origin
            new THREE.Vector3(0, 0, 0),
            // length
            25,
            // ----- Green color
            0x00ff00);
        this.scene.add(yAxis);

        // ARROW HELPER
        var zAxis = new THREE.ArrowHelper(
            // first argument is the direction
            new THREE.Vector3(0, 0, 2).normalize(),
            // second argument is the origin
            new THREE.Vector3(0, 0, 0),
            // length
            25,
            // ----- Yellow color
            0xFFFF00);
        this.scene.add(zAxis);
    }
    
  

  
}




