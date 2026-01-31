        import * as THREE from 'three';
        import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        let container, camera, renderer, controls;
        let sceneL, sceneR;
        let biboMat, gen3Mat;
        let meshL, meshR;
        let manager = new THREE.LoadingManager();
        const loader = new GLTFLoader(manager);
        const dracoloader = new DRACOLoader(manager);
        dracoloader.setDecoderPath('scripts/draco/');

        loader.setDRACOLoader(dracoloader);



        let sliderPos = window.innerWidth / 2;

        let modelData;
        let bodyL, bodyR;
        let menuR, menuL;
        let skeletonData = Array();

        document.getElementById("bottomarrow").addEventListener('mouseover', bottomMenu)
        document.getElementById("boobslider").addEventListener('input', changeBreastSize)
        await loadManifest();
        //await loadSkeletonValues();
        init();

        async function loadManifest(){
          const response = await (await (fetch("assets/manifest.json"))).text();
          modelData = JSON.parse(response);
        }

        function init() {

            container = document.querySelector('.container');

            bodyR = modelData.bodies[0];
            bodyL = modelData.bodies[1];

            sceneL = new THREE.Scene();
            sceneL.background = new THREE.Color(0xBCD48F);

            sceneR = new THREE.Scene();
            sceneR.background = new THREE.Color(0x8FBCD4);

            camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);

            camera.position.set(0.1, 1.33, 2.4);
            camera.rotation.set(-0.15, 0, 0);

            controls = new OrbitControls(camera, container);
            controls.maxDistance = 4;

            const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
            light.position.set(- 2, 2, 2);
            sceneL.add(light.clone());
            sceneR.add(light.clone());


            initMats();




            initMeshes();
            initSlider();
            populateInfobar();
            manager.onLoad = () => setupMeshes();
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setScissorTest(true);
            renderer.setAnimationLoop(animate);
            container.appendChild(renderer.domElement);

            window.addEventListener('resize', onWindowResize);

        }


        function initMeshes() {

            loader.load(bodyL.model, function (gltf) {
                sceneL.add(gltf.scene);
                meshL = gltf.scene.getObjectByProperty('bindMode', "attached");
                meshL.visible = false;
            }, undefined, function (error) {

                console.error(error);

            });

            loader.load(bodyR.model, function (gltf) {
                sceneR.add(gltf.scene);
                meshR = gltf.scene.getObjectByProperty('bindMode', "attached");
                meshR.visible = false;
            }, undefined, function (error) {

                console.error(error);

            });

        }

        function populateInfobar(){
            menuL = document.querySelector('#leftmenu');
            menuR = document.querySelector('#rightmenu');
            setInfobar(menuL, bodyL);
            setInfobar(menuR, bodyR);
        }

        function setInfobar(menu, body){

            var nameString = body.name;
            if(body.hasOwnProperty("selectedVariant")){
                nameString +=" : " +  body.selectedVariant;
            }
            menu.querySelector('.bodyName').innerText = nameString;


            menu.querySelector('.currentSize').innerText = body.selectedSize["top"] + " : " + body.selectedSize["bottom"];
            var side = menu.id;

            var bodyMenu = menu.querySelector(".bodyMenu");
            bodyMenu.innerHTML = '';
            bodyMenu.addEventListener("change",function(){changeBody(this, side)})
            for(let b in modelData.bodies){
                var bod = modelData.bodies[b];
                var opt = document.createElement('option');
                opt.value = bod.name;
                opt.innerHTML = bod.name;
                //opt.addEventListener("click",function(){changeBody(this, side)});
                bodyMenu.appendChild(opt);
            }
            bodyMenu.value = body.name;

            var topSelect = menu.querySelector('.topSelect');
            topSelect.innerHTML = '';
            topSelect.addEventListener("change",function(){changePrimaryShape(this, side, "tops")});
            for(var k in body.sizes["tops"]){
                var opt = document.createElement('option');
                opt.value = k;
                opt.innerHTML = k;
                //opt.addEventListener("click",function(){changePrimaryShape(this, side, "tops")});
                topSelect.appendChild(opt)
            }
            topSelect.value = body.selectedSize.top;

            var botSelect = menu.querySelector('.bottomSelect');
            botSelect.innerHTML = '';
            botSelect.addEventListener("change",function(){changePrimaryShape(this, side, "bottoms")});
            for(var k in body.sizes["bottoms"]){
                var opt = document.createElement('option');
                opt.value = k;
                opt.innerHTML = k;
                //opt.addEventListener("click",function(){changePrimaryShape(this, side, "bottoms")});
                botSelect.appendChild(opt)
            }
            botSelect.value = body.selectedSize.bottom;

            var variants = menu.querySelector(".variants");

            var variantSelector = variants.querySelector(".variantSelect");
            variantSelector.innerHTML = '';
            if(body.hasOwnProperty("selectedVariant")){
                variants.hidden = false;
                variantSelector.addEventListener("change",function(){changeVariant(this, side)});

                for(var k in body.variants){
                    var opt = document.createElement('option');
                    opt.value = k;
                    opt.innerHTML = k;
                    //opt.addEventListener("click",function(){changePrimaryShape(this, side, "bottoms")});
                    variantSelector.appendChild(opt)
                }
                variantSelector.value = body.selectedVariant;
            }else{
                variants.hidden = true;
            }


        }


        function changeBody(option, side){
            var model = modelData.bodies.find((e) => e.name == option.value);

            var mesh;
            

            if(side == "leftmenu"){
                if(bodyL.name == model.name){
                    return;
                }
                bodyL = model;
                sceneL.remove(sceneL.children[1]);

                loader.load(bodyL.model, function (gltf) {
                sceneL.add(gltf.scene);
                meshL = gltf.scene.getObjectByProperty('name', "Mannequin");
                mesh = meshL;
                setInfobar(menuL, bodyL);
                }, undefined, function (error) {

                console.error(error);

                });
            }else if(side == "rightmenu"){
                if(bodyR.name == model.name){
                    return;
                }
                bodyR = model;
                sceneR.remove(sceneR.children[1]);

                loader.load(bodyR.model, function (gltf) {
                sceneR.add(gltf.scene);
                meshR = gltf.scene.getObjectByProperty('name', "Mannequin");
                mesh = meshR;
                setInfobar(menuR, bodyR);
                }, undefined, function (error) {

                console.error(error);

                });
            }
            manager.onLoad = () =>{
                if(model.material == "bibo"){
                    mesh.material = biboMat;
                }else if(model.material == "gen3"){
                    mesh.material = gen3Mat;
                }
            }
        }

        function changePrimaryShape(option, side, subMesh){


            if(side == "leftmenu"){
                var id = option.value;
                
                    for(var k in bodyL.sizes[subMesh]){
                        var temp = meshL.userData.targetNames.indexOf(bodyL.sizes[subMesh][k]);
                        if(id == k){
                            meshL.morphTargetInfluences[temp] = 1;
                        }else{
                            meshL.morphTargetInfluences[temp] = 0;
                        }
                    };   
                    bodyL.selectedSize[subMesh.slice(0,-1)] = option.value;
                    populateInfobar(menuL, bodyL)   
            }else if(side == "rightmenu"){
                var id = option.value;
                    for(var k in bodyR.sizes[subMesh]){
                        var temp = meshR.userData.targetNames.indexOf(bodyR.sizes[subMesh][k]);
                        if(id == k){
                            meshR.morphTargetInfluences[temp] = 1;
                        }else{
                            meshR.morphTargetInfluences[temp] = 0;
                        }
                    }; 
                    bodyR.selectedSize[subMesh.slice(0,-1)] = option.value;
                    populateInfobar(menuR, bodyR)   
            }

        }


        function changeVariant(option, side){


            if(side == "leftmenu"){
                var id = option.value;
                
                    for(var k in bodyL.variants){
                        var temp = meshL.userData.targetNames.indexOf(bodyL.variants[k]);
                        if(id == k){
                            meshL.morphTargetInfluences[temp] = 1;
                        }else{
                            meshL.morphTargetInfluences[temp] = 0;
                        }
                    };   
                    bodyL.selectedVariant = option.value;
                    populateInfobar(menuL, bodyL)   
            }else if(side == "rightmenu"){
                var id = option.value;
                    for(var k in bodyR.variants){
                        var temp = meshR.userData.targetNames.indexOf(bodyR.variants[k]);
                        if(id == k){
                            meshR.morphTargetInfluences[temp] = 1;
                        }else{
                            meshR.morphTargetInfluences[temp] = 0;
                        }
                    }; 
                    bodyR.selectedVariant = option.value;
                    populateInfobar(menuR, bodyR)   
            }

        }
        //TODO: add full racial deforms https://github.com/TexTools/xivModdingFramework/blob/master/xivModdingFramework/Models/FileTypes/PDB.cs#L225
        function changeBreastSize(){
            var boobSlider = document.getElementById("boobslider");

            var skL = meshL.skeleton;
            var skR = meshR.skeleton;



            var width = (0.16 * boobSlider.value + 92) / 100;
            var depth = (0.368 * boobSlider.value + 81.6) / 100;
            var height = (0.4 * boobSlider.value + 80) / 100;
            var breastBones = Array( 
                skL.getBoneByName("j_mune_r"),
                skL.getBoneByName("j_mune_l"),
                skR.getBoneByName("j_mune_r"),
                skR.getBoneByName("j_mune_l")
            );

            var vector = new THREE.Vector3(height, width, depth);
            breastBones.forEach(bone => {
                bone.scale.copy(vector);
            });

            document.getElementById("boobslidervalue").innerText = boobSlider.value;

            //.scale = new THREE.Vector3(height, width, depth);
            //.scale = new THREE.Vector3(height, width, depth);
            //.scale = new THREE.Vector3(height, width, depth);
            //.scale = new THREE.Vector3(height, width, depth);

        }
            
        function populateVariants(){

        }

        function setVariant(){

        }

        function initMats() {

            var texloader = new THREE.TextureLoader();
            var biboBase = texloader.load('assets/textures/bibo_mid_base.png');
            var biboNorm = texloader.load('assets/textures/bibo_mid_norm.png');

            var gen3Base = texloader.load('assets/textures/Gen3Diffuse.png');
            var gen3Norm = texloader.load('assets/textures/Gen3Normal.png');

            biboBase.flipY = false;
            biboNorm.flipY = false;

            gen3Base.flipY = false;
            gen3Norm.flipY = false;

            biboMat = new THREE.MeshPhysicalMaterial({
                normalMap: biboNorm,
                map: biboBase,
                reflectivity: 0.6000000238418579,
                vertexColors: false,

            });

            gen3Mat = new THREE.MeshPhysicalMaterial({
                normalMap: gen3Norm,
                map: gen3Base,
                reflectivity: 0.6000000238418579,
                vertexColors: false,

            });

        }

        async function setupMeshes() {
            meshL.material = biboMat;
            meshR.material = biboMat;
            await meshL.geometry.computeBoundingBox()
            
            const bounding = new THREE.Vector3();
            
            meshL.geometry.boundingBox.getCenter(bounding);
            await camera.lookAt(bounding);
            controls.target = bounding;
            controls.update();
            meshR.visible = true;
            meshL.visible = true;
        }
        function initSlider() {

            const slider = document.querySelector('.slider');

            function onPointerDown() {

                if (event.isPrimary === false) return;

                controls.enabled = false;

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);

            }

            function onPointerUp() {

                controls.enabled = true;

                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);

            }

            function onPointerMove(e) {

                if (event.isPrimary === false) return;

                sliderPos = Math.max(0, Math.min(window.innerWidth, e.pageX));

                slider.style.left = sliderPos - (slider.offsetWidth / 2) + 'px';

            }

            slider.style.touchAction = 'none'; // disable touch scroll
            slider.addEventListener('pointerdown', onPointerDown);

        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);

        }

        function animate() {

            renderer.setScissor(0, 0, sliderPos, window.innerHeight);
            renderer.render(sceneL, camera);

            renderer.setScissor(sliderPos, 0, window.innerWidth, window.innerHeight);
            renderer.render(sceneR, camera);

        }


        
        function bottomMenu(){
            const bottomMenu = document.getElementById("bottommenu");
            if(bottomMenu.classList.contains("open")){
                bottomMenu.classList.remove("open");
                bottomMenu.classList.add("closed");
            }else{
                bottomMenu.classList.remove("closed");
                bottomMenu.classList.add("open");
            }

        }

        /*async function loadSkeletonValues(){
            var list = Array("0201", "0401", "0601", "0801", "1401", "1801"); //so I dont forget 201: middie, 401: highlander, 601: elezen, 801: miqo, 1401: au ra, 1801: viera

            list.forEach(async (element) => {
                const response =  (await (  )).text();
                skeletonData += JSON.parse(response);
            })

        }*/