class Editor {
    constructor({ orientation, model, rows, cols,id }) {
      this.id = id;
      this.orientation = orientation;
      this.model = model;
      this.rows = rows;
      this.cols = cols;
      this.isInitialCapturing = false;
      this.capturedFrames = 0;
      this.frames = [];
      this.isCapturing = false;
      this.captureCount = 0;
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.mixer = null;
      this.clock = null;
      this.gModel = null;
    }
  
    async init() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.domElement.id = 'editor'+this.id;
      this.renderer.setClearColor(0x0000ff);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('container').appendChild(this.renderer.domElement);
  
      const ambientLight = new THREE.AmbientLight(0xeeeeee, 0.5);
      this.scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      directionalLight.position.set(5, 30, 57.5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      this.scene.add(directionalLight);
  
      this.clock = new THREE.Clock();
      this.gModel = await this.loadModel().catch(console.error);
      if (this.gModel) this.captureInitialFrames();
    }
  
    async update({ orientation, model, rows, cols }) {
      if (orientation && orientation !== this.orientation) {
        this.orientation = orientation;
        this.updateOrientation(this.gModel);
        this.captureInitialFrames();
      }
  
      if (model && model !== this.model) {
        this.model = model;
        this.gModel = await this.loadModel();
        this.captureInitialFrames();
      }
  
      if (rows && rows !== this.rows) {
        this.rows = rows;
        this.captureInitialFrames();
      }
  
      if (cols && cols !== this.cols) {
        this.cols = cols;
        this.captureInitialFrames();
      }
    }
  
    loadModel() {
      return new Promise((resolve, reject) => {
        const loader = new THREE.FBXLoader();
        if (!this.model) {
          reject('No model selected');
          return;
        }
  
        loader.load('/extensions/ComfyUI-Benripack/3d_models/'+this.model, (object) => {
          let box = new THREE.Box3().setFromObject(object);
          let size = box.getSize(new THREE.Vector3());
          const maxAxis = Math.max(size.x, size.y, size.z);
          object.scale.multiplyScalar(100.0 / maxAxis);
  
          object.traverse((child) => {
            if (child.isMesh && !child.name.includes('Joints')) {
              child.castShadow = true;
              child.receiveShadow = true;
              // set color
              //const material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
              //child.material.color = material.color;
            }
          });
  
          if (this.gModel) this.scene.remove(this.gModel);
          this.updateOrientation(object);
          this.scene.add(object);
          box.getCenter(object.position).multiplyScalar(-1);
          object.position.y = 0;
  
          if (object.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(object);
            const action = this.mixer.clipAction(object.animations[0]);
            action.play();
          }
          box = new THREE.Box3().setFromObject(object);
          size = box.getSize(new THREE.Vector3());
          this.camera.position.set(0, size.y/2 + 20, 120);
          this.camera.lookAt(new THREE.Vector3(0, size.y/2, 0));
          resolve(object);
        });
      });
    }
  
    updateOrientation(object) {
      switch (this.orientation) {
        case 'Front': object.rotation.y = 0; break;
        case 'Rotate': object.rotation.y = 0; break;
        case 'Back': object.rotation.y = Math.PI; break;
        case 'Left': object.rotation.y = -Math.PI / 2; break;
        case 'Right': object.rotation.y = Math.PI / 2; break;
      }
    }
  
    captureInitialFrames() {
      this.isInitialCapturing = true;
      this.capturedFrames = 0;
      this.frames = [];
      const captureNextFrame = () => {
        if (this.capturedFrames < this.rows * this.cols) {
          if (this.mixer) {
            var t = this.mixer._actions[0]._clip.duration;
            this.mixer.setTime(t * (this.capturedFrames / (this.rows * this.cols)));
          }
          if(this.orientation == "Rotate") this.gModel.rotation.y = 2 * Math.PI * (this.capturedFrames / (this.rows * this.cols));
          this.renderer.render(this.scene, this.camera);
          this.captureFrame();
          this.capturedFrames++;
          requestAnimationFrame(captureNextFrame);
        } else {
          this.isInitialCapturing = false;
          if (this.mixer) this.mixer.setTime(0);
          requestAnimationFrame(this.animate.bind(this));
        }
      };
      setTimeout(() => {
        captureNextFrame();
      }, 2000);
    }
  
    async captureFrame() {
      this.renderer.render(this.scene, this.camera);
      this.frames.push(this.renderer.domElement.toDataURL());
      this.captureCount++;
      if (this.captureCount >= (this.rows * this.cols)) {
        this.isCapturing = false;
        console.log('Captured frames', this.frames);
        var animation = await this.createAnimationImage(this.rows, this.cols, this.frames);
        window.parent.postMessage({ type: 'capture', frames: this.frames, animation: animation, id: this.id }, '*');
      }
    }
  
    animate() {
      requestAnimationFrame(this.animate.bind(this));
      if (!this.isInitialCapturing) {
        if(this.mixer) this.mixer.update(this.clock.getDelta());
        if(this.orientation == "Rotate"){
            this.gModel.rotation.y += 0.01
            this.gModel.rotation.y %= 2 * Math.PI
        }
      }
      this.renderer.render(this.scene, this.camera);
    }
  
    startCapture() {
      this.frames = [];
      this.isCapturing = true;
      this.captureCount = 0;
    }
  
    createAnimationImage(rows, cols, frames) {
        
        return new Promise((resolve, reject) => {
            if (frames.length === 0) {
                reject('No frames to create animation image');
                return;
            }

    
            // Create a temporary image to get dimensions
            const tempImg = new Image();
            tempImg.onload = () => {
                
                const frameWidth = tempImg.width;
                const frameHeight = tempImg.height;
                
                
                // Create a canvas that will hold all frames in a grid
                this.canvas = document.createElement('canvas');
                this.canvas.width = frameWidth * cols;
                this.canvas.height = frameHeight * rows;
                
                const ctx = this.canvas.getContext('2d');
    
                // Function to draw each frame
                const drawFrame = (index) => {
                    if (index >= frames.length || index >= rows * cols) {
                        // All frames have been drawn or grid is full, resolve with the result
                        console.log("Länge: " + this.canvas.toDataURL().length,this.id)
                        resolve(this.canvas.toDataURL());
                        return;
                    }
    
                    const img = new Image();
                    img.onload = () => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        ctx.drawImage(img, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
                        drawFrame(index + 1);
                    };
                    img.onerror = reject;
                    img.src = frames[index];
                };
    
                // Start drawing frames
                drawFrame(0);
            };
            tempImg.onerror = reject;
            tempImg.src = frames[0];
        });
    }
  
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  // Event listeners
  function onMessage(event) {
    if(!window.editor) window.editor = {};
    if (!event.data.orientation) return;
    if (window.editor && window.editor[event.data.id]) {
      window.editor[event.data.id].update(event.data);
    } else {
      window.editor[event.data.id] = new Editor(event.data);
      window.editor[event.data.id].init();
    }
  }
  
  window.addEventListener('resize', () => {
    for (const key in window.editor) window.editor[key].onWindowResize();
  })
  window.addEventListener('message', onMessage);