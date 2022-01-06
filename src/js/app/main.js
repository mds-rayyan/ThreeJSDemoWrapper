// Global imports -
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import gsap from 'gsap';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

// Local imports -
// Components
import Renderer from './components/renderer';
import Camera from './components/camera';
import Light from './components/light';
import Controls from './components/controls';
import Geometry from './components/geometry';
import Transition from './components/transition';

// Helpers
import Stats from './helpers/stats';
import MeshHelper from './helpers/meshHelper';
import AxisHelper from './helpers/axisHelper';

// Model
import Texture from './model/texture';
import Model from './model/model';

// Managers
import Interaction from './managers/interaction';
import DatGUI from './managers/datGUI';

// data
import Config from './../data/config';
import { Vector3 } from 'three';

// -- End of imports



// This class instantiates and ties all of the components together, starts the loading process and renders the main loop
// bool var
var enable = true;
export default class Main {
  constructor(container) {

    this.productIntersectPoint = undefined;
    this.productName = '';
    // creating camera standing postion
    this.products = [
      { "name": "Prod1", "standingPos": { "x": 0, "y": 4, "z": -7 }, "lookAtPos": { "x": 9, "y": 2, "z": -8 } },
      { "name": "Prod2", "standingPos": { "x": 0, "y": 4, "z": 0 }, "lookAtPos": { "x": 8, "y": 3, "z": 0 } },
      { "name": "Prod3", "standingPos": { "x": 0, "y": 4, "z": 7 }, "lookAtPos": { "x": 9, "y": 2, "z": 8 } },
      { "name": "Prod4", "standingPos": { "x": 0, "y": 4, "z": 7 }, "lookAtPos": { "x": -10, "y": 2, "z": 6 } }
    ];
    this.selectedObjects = [];

    // Create an AnimationMixer, and get the list of AnimationClip instances
    this.mixer = new THREE.AnimationMixer();

    // Set container property to container element
    this.container = container;

    // Start Three clock
    this.clock = new THREE.Clock();

    
    // Main scene creation
    this.sceneA = new THREE.Scene();
    const geometryA = new THREE.SphereGeometry(15, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(geometryA, material);
    this.sceneA.add(sphere);
    
    this.sceneB = new THREE.Scene();
    const geometryB = new THREE.ConeGeometry(15, 32, 16);
    const cone = new THREE.Mesh(geometryB, material);
    this.sceneB.add(cone);
    // Transition
    this.transition=new Transition(this.sceneA,this.sceneB)
    


    this.scene = new THREE.Scene();
    this.currentScene = this.scene;
    this.scene.fog = new THREE.FogExp2(Config.fog.color, Config.fog.near);
    
    // Main scene creation
    this.scene1 = new THREE.Scene();
    this.scene1.fog = new THREE.FogExp2(Config.fog.color, Config.fog.near);
    
    // Get Device Pixel Ratio first for retina
    if (window.devicePixelRatio) {
      Config.dpr = window.devicePixelRatio;
    }
    
    // Main renderer constructor
    this.renderer = new Renderer(this.scene, container);
    

    // Components instantiations
    this.camera = new Camera(this.renderer.threeRenderer);
    this.controls = new Controls(this.camera.threeCamera, container);
    this.light = new Light(this.scene);

    // Create and place lights in scene
    const lights = ['ambient', 'directional', 'point', 'hemi'];
    lights.forEach((light) => this.light.place(light));

    // Window Resize
    window.addEventListener('resize', () => {

      this.camera.threeCamera.aspect = window.innerWidth / window.innerHeight;
      this.camera.threeCamera.updateProjectionMatrix();

      // this.renderer.setSize(window.innerWidth, window.innerHeight);

    });


    window.addEventListener('click', (event) => {
      enable = false;
    })


    // // Create and place geo in scene
    // this.geometry = new Geometry(this.scene);
    // this.geometry.make('plane')(150, 150, 10, 10);
    // this.geometry.place([0, -20, 0], [Math.PI / 2, 0, 0]);

    // Set up rStats if dev environment
    if (Config.isDev && Config.isShowingStats) {
      this.stats = new Stats(this.renderer);
      this.stats.setUp();
    }

    // Set up gui
    if (Config.isDev) {
      this.gui = new DatGUI(this)
    }

    // Instantiate texture class
    this.texture = new Texture();


    //postprocssing

    this.composer = new EffectComposer(this.renderer.threeRenderer);


    this.renderPass = new RenderPass(this.currentScene, this.camera.threeCamera);
    this.composer.addPass(this.renderPass);






    // const raycaster = new THREE.Raycaster();


    // this.renderer.threeRenderer.domElement.addEventListener('pointermove', (event) => {

    //   // if (event.isPrimary === false) return;
    //   const pointer = new THREE.Vector2();

    //   pointer.x = (event.clientX / this.renderer.threeRenderer.domElement.clientWidth) * 2 - 1;
    //   pointer.y = -(event.clientY / this.renderer.threeRenderer.domElement.clientHeight) * 2 + 1;

    //   checkIntersection();

    // });
    // function checkIntersection() {

    //   const pointer = new THREE.Vector2();
    //   raycaster.setFromCamera(pointer, this.camera.threeCamera  );

    //   const intersects = raycaster.intersectObject(this.currentScene, true);

    //   if (intersects.length > 0) {

    //     this.selectedObject = intersects[0].object;
    //     addSelectedObject(this.selectedObject);
    //     this.outlinePass.selectedObjects = this.selectedObjects;

    //   } else {

    //     this.outlinePass.selectedObjects = [];

    //   }
    // }

    // Start loading the textures and then go on to load the model after the texture Promises have resolved
    this.texture.load().then(() => {
      this.manager = new THREE.LoadingManager();

      // Textures loaded, load model
      this.model = new Model(this.scene, this.manager, this.texture.textures, 'LoadingScene');
      this.model.load(Config.models[Config.model.selected].type);

      // onProgress callback
      this.manager.onProgress = (item, loaded, total) => {
        console.log(`${item}: ${loaded} ${total}`);
      };

      // All loaders done now
      this.manager.onLoad = () => {
        // Set up interaction manager with the app now that the model is finished loading
        new Interaction(this.renderer.threeRenderer, this.scene, this.camera.threeCamera, this.controls.threeControls);

        // // Add dat.GUI controls if dev
        // if(Config.isDev) {
        //   this.meshHelper = new MeshHelper(this.scene, this.model.obj);
        //   if (Config.mesh.enableHelper) this.meshHelper.enable();

        //   this.gui.load(this, this.model.obj);
        // }

        // Everything is now fully loaded
        Config.isLoaded = true;
        // this.container.querySelector('#loading').style.display = 'none';
      };


      document.addEventListener('click', (event) => {
        this.controls.threeControls.autoRotate = false;
        this.THREE
        // raycaster and pointer objects
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();


        pointer.x = (event.clientX / this.renderer.threeRenderer.domElement.clientWidth) * 2 - 1;
        pointer.y = -(event.clientY / this.renderer.threeRenderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, this.camera.threeCamera);

        // See if the ray from the camera into the world hits one of our meshes
        const intersects = raycaster.intersectObject(this.currentScene, true);
        if (intersects && intersects.length > 0) {
          console.log(intersects);
          switch (this.currentScene.name) {
            case 'LoadingScene':
              this.loadHomeScreen(intersects);
              break;
            case 'HomeScene':
              if (this.isProductClicked(intersects)) {
                this.loadProductOverview();
              } else {
              }
            default:
              break;
          }
        }
      })

      const raycaster = new THREE.Raycaster();

      document.addEventListener("keydown", (event) => {
        const intersects = raycaster.intersectObject(this.currentScene, true);
        if (event.keyCode == 65 || event.keyCode == 37) {
          this.fetchProduct('PREV');
        } else if (event.keyCode == 68 || event.keyCode == 39) {
          this.fetchProduct('NEXT');
        } else if (event.keyCode == 27) {
          // this.loadHomeScreen(intersects);
          this.loadProductOverview();
        }

      });

      // document.addEventListener("pointermove",(event) => {
      //   // raycaster and pointer objects
      //   const raycaster = new THREE.Raycaster();
      //   const pointer = new THREE.Vector2();


      //   pointer.x = (event.clientX / this.renderer.threeRenderer.domElement.clientWidth) * 2 - 1;
      //   pointer.y = -(event.clientY / this.renderer.threeRenderer.domElement.clientHeight) * 2 + 1;
      //   raycaster.setFromCamera(pointer, this.camera.threeCamera);

      //   // See if the ray from the camera into the world hits one of our meshes
      //   const intersects = raycaster.intersectObject(this.currentScene, true);

      //   if ( intersects.length > 0 ) {

      // 		const selectedObject = intersects[ 0 ].object;
      // 		this.addSelectedObject( selectedObject );
      // 		this.outlinePass.selectedObjects = this.selectedObjects;

      // 	} else {

      // 		// outlinePass.selectedObjects = [];

      // 	}

      // });




    });

    // Start render which does not wait for model fully loaded
    this.render();
  }


  addSelectedObject(object) {

    this.selectedObjects = [];
    this.selectedObjects.push(object);

  }

  loadProductOverview() {
    const duration = 3;
    const target = this.products[this.productIndex].standingPos;
    const lookAtpos = this.products[this.productIndex].lookAtPos;

    gsap.to(this.camera.threeCamera.position, {
      duration: duration,
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        this.camera.threeCamera.lookAt(new THREE.Vector3(lookAtpos.x, lookAtpos.y, lookAtpos.z));
      },
      onComplete: () => {
        this.controls.threeControls.minDistance = 0;
        this.controls.threeControls.target.x = lookAtpos.x;
        this.controls.threeControls.target.y = lookAtpos.y;
        this.controls.threeControls.target.z = lookAtpos.z;

        this.model.load(Config.models[3].type);
      }
    });
  }

  isProductClicked(intersects) {
    var isProductClicked = false;
    if (intersects && intersects.length > 0) {
      intersects.forEach((intersect) => {
        if (intersect.object.name.toLowerCase().includes('prod')) {
          this.productName = intersect.object.name;
          this.products.forEach((productData, index) => {
            if (productData.name === this.productName) {
              this.productIndex = index;
            };
          });
          isProductClicked = true;
        }
      });
    }
    this.mixer = new THREE.AnimationMixer(this.model.gltfModel.scene);
    const clips = this.model.gltfModel.animations;
    // Play a specific animation
    const clip = THREE.AnimationClip.findByName(clips, this.productName + 'Action');
    const action = this.mixer.clipAction(clip);
    action.play();


    return isProductClicked;
  }

  loadHomeScreen(intersects) {


    var duration = 2;
    var target = new THREE.Vector3();
    console.log(intersects[0]);
    target.x = 0;
    target.y = -20;
    target.z = this.camera.threeCamera.position.z;

    gsap.to(this.camera.threeCamera.position, {
      duration: duration,
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        this.camera.threeCamera.lookAt(new THREE.Vector3(0, 0, 0));
      },
      onComplete: () => {
        this.controls.threeControls.minDistance = 0;
        this.changeScene();

        // Trigger scene change
        setTimeout(() => {
          this.camera.threeCamera.position.x = 0;
          this.camera.threeCamera.position.y = 5;
          this.camera.threeCamera.position.z = -16;
          this.controls.threeControls.target.x = 0;
          this.controls.threeControls.target.y = 5;
          this.controls.threeControls.target.z = 8;

          this.currentScene = this.scene1;
          Config.model.selected = 1;

          // Textures loaded, load model
          this.model = new Model(this.scene1, this.manager, this.texture.textures, 'HomeScene');
          this.model.load(Config.models[Config.model.selected].type);
          this.light = new Light(this.scene1);

          // Create and place lights in scene
          const lights = ['ambient', 'directional', 'point', 'hemi'];
          lights.forEach((light) => this.light.place(light));

          this.axisHelper = new AxisHelper(this.currentScene);
          this.axisHelper.add();

         

        }, 1000);
      }
    });

  }

  loadProductDetailsScene() {
    target.x = 0;
    target.y = -20;
    target.z = this.camera.threeCamera.position.z;

    gsap.to(this.camera.threeCamera.position, {
      duration: duration,
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        this.camera.threeCamera.lookAt(new THREE.Vector3(0, 0, 0));
      },
      onComplete: () => {
        this.controls.threeControls.minDistance = 0;
        this.changeScene();

        // Trigger scene change
        setTimeout(() => {
          this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.currentScene, this.camera.threeCamera);
          this.outlinePass.renderToScreen = true
          this.composer.addPass(this.outlinePass);
          document.addEventListener("pointermove", (event) => {
            // const glitchPass = new GlitchPass();
            // this.composer.addPass(glitchPass);
            console.log("Hello");
            // raycaster and pointer objects
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();


            pointer.x = (event.clientX / this.renderer.threeRenderer.domElement.clientWidth) * 2 - 1;
            pointer.y = -(event.clientY / this.renderer.threeRenderer.domElement.clientHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, this.camera.threeCamera);

            // See if the ray from the camera into the world hits one of our meshes
            const intersects = raycaster.intersectObject(this.currentScene, true);

            if (intersects[0] && intersects[0].object && intersects[0].object.name.toLowerCase().includes('prod')) {


              this.selectedObject = intersects[0].object;
              // console.log(intersects[0].object.name);
              this.addSelectedObject(this.selectedObject);
              this.outlinePass.selectedObjects = this.selectedObjects;
              // console.log(this.selectedObjects)

            }
            else {

              this.outlinePass.selectedObjects = [];

            }
          });
          this.camera.threeCamera.position.x = 0;
          this.camera.threeCamera.position.y = 5;
          this.camera.threeCamera.position.z = -15;
          this.controls.threeControls.target.x = 0;
          this.controls.threeControls.target.y = 5;
          this.controls.threeControls.target.z = 8;

          this.currentScene = this.scene1;
          Config.model.selected = 1;

          // Textures loaded, load model
          this.model = new Model(this.scene1, this.manager, this.texture.textures, 'HomeScene');
          this.model.load(Config.models[Config.model.selected].type);
          this.light = new Light(this.scene1);

          // Create and place lights in scene
          const lights = ['ambient', 'directional', 'point', 'hemi'];
          lights.forEach((light) => this.light.place(light));
        }, 1000);
      }
    });
  }

  changeScene() {
    // Trigger animation
    // var transitionDiv = document.getElementById("transition");
    // transitionDiv.classList.remove('transition-hide');
    // transitionDiv.classList.add('transition-show');
    // // Trigger scene change
    // setTimeout(() => {
    //   transitionDiv.classList.remove('transition-show');
    // }, 2000);
  };

  fetchProduct(direction) {
    let nextIndex;
    if (direction === 'NEXT') {
      this.productIndex = (this.productIndex + 1) > (this.products.length - 1) ? 0 : (this.productIndex + 1);
    } else if (direction === 'PREV') {
      this.productIndex = (this.productIndex - 1) < 0 ? (this.products.length - 1) : (this.productIndex - 1);
    }

    const target = this.products[this.productIndex].standingPos;
    const lookAtpos = this.products[this.productIndex].lookAtPos;

    // Play a specific animation
    const clips = this.model.gltfModel.animations;
    const clip = THREE.AnimationClip.findByName(clips, this.products[this.productIndex].name + 'Action');
    const action = this.mixer.clipAction(clip);
    action.play();

    gsap.to(this.camera.threeCamera.position, {
      duration: 3,
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        this.camera.threeCamera.lookAt(new THREE.Vector3(lookAtpos.x, lookAtpos.y, lookAtpos.z));
      },
      onComplete: () => {
        this.controls.threeControls.minDistance = 0;
        this.controls.threeControls.target.x = lookAtpos.x;
        this.controls.threeControls.target.y = lookAtpos.y;
        this.controls.threeControls.target.z = lookAtpos.z;
      }
    });
  }



  render() {

    // Render rStats if Dev
    if (Config.isDev && Config.isShowingStats) {
      Stats.start();
    }

    // Call render function and pass in created scene and camera
    // this.renderer.setScissor(0,0,window.innerWidth,window.innerHeight);
    // if (enable) {
    //   this.renderer.render(this.scene, this.camera.threeCamera);
    // }
    // else {
      // this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
      // this.model.load(Config.models[3].type);
      //   // this.renderer.render(this.scene2, this.camera.threeCamera);
      
      // }  
      // rStats has finished determining render call now
      if (Config.isDev && Config.isShowingStats) {
        Stats.end();
      }
      
      // Delta time is sometimes needed for certain updates
      const delta = this.clock.getDelta();
      this.transition.render(delta);

    // Call any vendor or module frame updates here
    TWEEN.update();
    this.controls.threeControls.update();

    this.mixer.update(delta);

    // this.composer.renderer.render(this.currentScene, this.camera.threeCamera);
    // this.composer.render();


    // RAF
    requestAnimationFrame(this.render.bind(this)); // Bind the main class instead of window object
  }
}
