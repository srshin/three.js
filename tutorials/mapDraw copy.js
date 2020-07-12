
// poi, 바닥판 수정
// icon 투명도 변경
// javascript API 수정

// import { DragControls } from './jsm/controls/DragControls.js';
// import {NetworkConstant} from '../constants/NetowkConstant.js';
import * as THREE from '../build/three.module.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { TrackballControls } from './jsm/controls/TrackballControls.js';
import d3threeD from './d3.js';
import './css/map.css';

// import fontTest from './fonts/NanumBarunGothic_Regular.font'
// import patternTest from './textures/PT_08@3x.png';
// import textureTest from './textures/square-outline-textured.png';

// function addCss(fileName) {

//     var head = document.head;
//     var link = document.createElement("link");
  
//     link.type = "text/css";
//     link.rel = "stylesheet";
//     link.href = fileName;
  
//     head.appendChild(link);
//   }
  
//   addCss('./css/map.css');
let textureArray = [
    ["G1", 0.02], 
    ["G2", 0.02],
    ["G3", 0.02],
    ["G4", 0.02],
    ["G5", 0.02],
    ["G6", 0.02],
    ["m1", 0.01], 
    ["m2", 0.03], 
    ["m3", 0.02], 
    ["m4", 0.02], 
    ["m5", 0.02], 
    ["m6", 0.02], 
    ["S1", 0.03],
    ["S2", 0.03],
    ["S3", 0.03],
    ["S4", 0.08],
    ["S5", 0.03],
    ["S6", 0.03],
    ["ST1", 0.02],
    ["ST2", 0.1],
    ["ST3", 0.02],
    ["ST4", 0.02],
    ["w1", 0.04],
    ["w2", 0.02]
];
let textureMap = new Map(textureArray);
let textureUrl ="https://demo-preview.dabeeomaps.com/image/pattern/S5.jpg"; 
// let key = textureUrl.split("pattern/")[1].split(".")[0];
// console.log(textureMap.get(key));

export class MapDraw {
    constructor (container, mapOptions, data) {
        this.mapOptions = mapOptions; 
        console.log(mapOptions)
        this.objects=[];
        this.$d3g = {};
        
        this.mapInfo = data;
        this.floorTheme = data.payload.themes; 
        this.floorData = data.payload.floors; 
        this.oldGroup = null;
        this.poiGroup = null;
        this.defaultFloor = null; 
        this.defaultTheme = null; 
        this.svgObj = null; 
        

        
        this.renderer=null;
        this.scene=null;
        this.controls=null; 
        this.container = container;
        this.center={x:0, y:0};
        d3threeD( this.$d3g );
        this.perspectiveCamera = null;
        this.orthographicCamera = null;
        this.params = {
            orthographicCamera : false
        };
        this.frustumSize = 500;
        this.x = -200;
        this.y = 10;  
        this.makeResponse();
        console.log(this.response);
    }
    makeResponse () {
        this.response = {
            mapName:null,
            floorInfo:[],
            themeInfo: [],
            langInfo: null,
            poiInfo: [],
            poiCategories:null
        }
        this.response.mapName = this.mapInfo.payload.name; 
        this.response.langInfo = this.mapInfo.payload.languageSets;
        this.response.poiCategories = this.mapInfo.poiCategories;

        for (let floor of this.floorData) {
            let floorItem = {
                id : floor.id,
                name: floor.name,
                defaultYn : floor.defaultYn
            }
            this.response.floorInfo.push(floorItem);
        }
        for (let theme of this.floorTheme) {
            let themeItem = {
                id: theme.id,
                name: theme.name,
                defaultYn : theme.defaultYn
            }
            this.response.themeInfo.push(themeItem)
        }
        for (let floor of this.floorData) {
            for (let poi of floor.pois) {
                let poiItem = { 
                    id : poi.id,
                    floorId: poi.floorId,
                    title:poi.title,
                    categoryCode : poi.categoryCode,
                    icoUrl: poi.iconUrl
                }
                this.response.poiInfo.push(poiItem)
            }
        }
    }


    init() {

        document.addEventListener('click', (e)=>{
            console.log(e.target);
            console.log("clientX:", e.clientX, "clientY", e.clientY);    //position of the mouse 전체 좌표
            console.log("e.offsetX : ", e.offsetX, "e.offsetY : ", e.offsetY);    //엘리먼트안에서의 좌표
        });

        this.scene = new THREE.Scene();
        

        console.log('mapInfo : ', this.mapInfo);
        console.log('floor :', this.floorData);
        console.log('theme : ', this.floorTheme);
        console.log('map 이름 :', this.mapInfo.payload.name);
        console.log('mapsize :', this.mapInfo.payload.size);
        console.log('objects 갯수: ',this.floorData[0].objects.length)
        console.log('section 갯수: ',this.floorData[0].sections.length)
        console.log('pois 갯수: ',this.floorData[0].pois.length)
        console.log('theme 갯수: ',this.floorTheme.length)

        this.center={
            x:this.mapInfo.payload.size.width/10, 
            y:this.mapInfo.payload.size.height/10
        };
        console.log (`window.innerWidth: ${window.innerWidth}, window.innerHeight: ${window.innerHeight} `);
        console.log('width:' ,this.mapInfo.payload.size.width, 'height: ', this.mapInfo.payload.size.height);
        console.log('center x:' ,this.center.x, 'center y:', this.center.y);

        //
        let aspect= window.innerWidth / window.innerHeight
        this.perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 10000 );
        this.perspectiveCamera.position.set( 0, 0, this.mapInfo.payload.size.width/6 );
	    this.frustumSize = this.mapInfo.payload.size.width/6;
        // this.perspectiveCamera.position.set( 0,0, 400);
        // this.perspectiveCamera = new THREE.PerspectiveCamera( 70, aspect, 60, 10000 );
        //

        this.orthographicCamera = new THREE.OrthographicCamera( this.frustumSize * aspect / - 2, 
            this.frustumSize * aspect / 2, this.frustumSize / 2, this.frustumSize / - 2, 1, 10000 );
        this.orthographicCamera.position.set( 0, 0, this.mapInfo.payload.size.width/6 );

        this.particleLight = new THREE.Mesh( new THREE.SphereBufferGeometry( 6, 8, 8 ), new THREE.MeshPhongMaterial( { color: 0x00ff00 } ) );
        if (this.mapInfo.payload.id == "MP-ts56akww3zok3763" || this.mapInfo.payload.id == "MP-vf0vyrza7fw51987") {
            this.scene.add( this.particleLight );
            var pointLight = new THREE.PointLight( 0xffffff, 2, 100 );
            this.particleLight.add( pointLight );
        }

        
        //lights
        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        // var directionalLight = new THREE.DirectionalLight( 0x0f0f0f, 0.6 );
        // directionalLight.position.set( 0.75, 0.75, 0.75 ).normalize();
        this.scene.add( directionalLight );
        
        if (this.mapInfo.payload.type =="RSLAM") {        
            this.scene.background = new THREE.Color( 0x969696 );
            var ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
        } else {
            this.scene.background = new THREE.Color( 0xeeeeee );
            var ambientLight = new THREE.AmbientLight( 0x404040, 0.6 );
        }
        this.scene.add( ambientLight );
        
        var hemisphereLight = new THREE.HemisphereLight(0xeeeeee, 0x333333, 1.4);
        this.scene.add(hemisphereLight);   

        // var light1 = new THREE.PointLight(0xffffff, 0.2);
        // scene.add(light1);
        
        var helper = new THREE.GridHelper( 1000, 100 );
        helper.rotation.x = Math.PI / 2;
        // this.scene.add( helper );
        
        var axesHelper = new THREE.AxesHelper(1000 );
        // this.scene.add( axesHelper );				
        
        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        // var gui = new GUI();
		// gui.add( this.params, 'orthographicCamera' ).name( '2d' ).onChange( ( value )=> {
			// this.controls.dispose();
			// this.createControls( value ? this.orthographicCamera : this.perspectiveCamera );
		// } );
        
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
        
        this.createControls(this.perspectiveCamera);
        this.redrawMap(this.mapOptions);
    }
    changeCamera(mapOptions) {

        let options = Object.assign(this.mapOptions, mapOptions);
        this.controls.dispose();
        if (options.camera =="2d") {
            this.params.orthographicCamera = true;  
            this.createControls( this.orthographicCamera);
        } else {
            this.params.orthographicCamera = false;  
            this.createControls( this.perspectiveCamera);
        }
    }
    createControls(camera) {
        this.controls = new OrbitControls( camera, this.renderer.domElement );
        // this.controls.update();

        // //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
        // this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        // this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 100;
        if (this.params.orthographicCamera) {
            this.controls.enableRotate = false;
        } else {
            this.controls.enableRotate = true;
        }
        // // this.controls.maxDistance = 10000;
        // this.controls.maxPolarAngle = Math.PI / 2;

        // this.controls = new TrackballControls( camera, this.renderer.domElement );
        // this.controls.rotatespeed = 2.0;
        // this.controls.zoomSpeed= 5.2;
        // this.controls.panSpeed = 10.0; 
        // this.controls.keys = [65,83,68];
        // this.controls.minDistance = 10;
        // this.controls.maxDistance = 1000;
    }
    onWindowResize () {
        let aspect = window.innerWidth/ window.innerHeight;
        this.perspectiveCamera.aspect = aspect; 
        this.perspectiveCamera.updateProjectionMatrix();
        
        this.orthographicCamera.left = -this.frustumSize * aspect /2;
        this.orthographicCamera.right = this.frustumSize * aspect /2;
        this.orthographicCamera.top = this.frustumSize /2;
        this.orthographicCamera.bottom = -this.frustumSize  /2;
        
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        // this.controls.handleResize(); trackball인 경우에만 추가 
    }

    changeShowPoi(mapOptions) {
        let options = Object.assign(this.mapOptions, mapOptions);
        
        if (options.showPoi) {
            let obj = this.svgObj;
            this.poiGroup = new THREE.Group(); 
            this.scene.add(this.poiGroup)
            if (!this.font) {
                var loader = new THREE.FontLoader();
                // three.js/examples/fonts/NanumBarunGothic_Regular.json
                loader.load("https://assets.dabeeomaps.com/upload/fonts/NanumBarunGothic_Regular.font", (font)=> {        
                    this.font = font; 
                    this.initPoiTitle(obj.zCords, this.defaultFloor);
                });
            } else {
                this.initPoiTitle(obj.zCords, this.defaultFloor);
            }
            this.initPoiIcon(obj.zCords, this.defaultFloor);
    
        } else {
            if (this.poiGroup) {
            this.scene.remove(this.poiGroup);
            }
        }
    }
    redrawMap(mapOptions) {
        let options = Object.assign(this.mapOptions, mapOptions)
        if (this.oldGroup) {
            this.scene.remove(this.oldGroup)
        }
        if (this.poiGroup) {
            this.scene.remove(this.poiGroup);
        }
        var group = new THREE.Group();
        this.oldGroup = group; 
        this.scene.add( group );

        this.defaultFloor = this.findDefaultFloor(options.floor)
        this.defaultTheme = this.findDefaultTheme(options.theme) 
        this.svgObj = this.initSVGObject(this.defaultFloor, this.defaultTheme);
        // console.log(obj.zCords);
        this.initObject( group, this.svgObj );
        this.changeShowPoi(mapOptions)

    }

    initSVGObject(defaultFloor, defaultTheme) {

        let obj = {};

        obj.paths=[];
        obj.title=[];
        obj.depths = [];
        obj.colors = [];
        obj.zCords = new Map();
        obj.lineColors=[];
        obj.patternUrls=[];
        console.log ("defaultFloor의 object  갯수 : ", defaultFloor.objects.length);
        // let increment = 0; 
        this.setObj(obj, defaultFloor.objects, defaultTheme.objectStyles);
        this.setObj(obj, defaultFloor.sections, defaultTheme.sectionStyles);
        return obj;
        // obj.paths = [
        // 	/// Taipei City
        // 	"M400,110  " +
        // 	"L400,120 L400,130  " +
        // 	"L350,130 L350,115  Z",
        // 	"M400,90  " +
        // 	"L400,100 L400,109  " +
        // 	"L350,109 L350,100  Z"
        //  ];
        // obj.depths = [ 10,20];
        // obj.colors = [ 0x808080, 0xC0A000 ];
        // obj.center = { x: 365, y: 125 };

    }
    resizeX(x) {
        return (x/5).toFixed(4)
    }
    resizeY(y) {
        if (this.mapInfo.payload.type=="RSLAM") {
            return ((this.mapInfo.payload.size.height-y)/5).toFixed(4)
        } else {
            return (y/5).toFixed(4)
        }
    }
    setObj (obj, objects, styles) {
        for (let arr of objects) {
                // increment++;
                // if (increment ==2) break;
                let str="";
                let pre="M"
                for (let cor of arr.coordinates) {
                    let x= this.resizeX(cor.x);
                    let y= this.resizeY(cor.y);
                
                    str +=pre+x.toString()+","+y.toString()+"  ";
                    pre="L";
            }
            str +="Z"
            // console.log(str);			
            obj.paths.push(str);
            let found = false; 
            for (let theme of styles) {
                if (arr.style.groupCode == theme.groupCode) {
                    // console.log(theme.patternUrl);
                    obj.patternUrls.push(theme.patternUrl);
                    obj.lineColors.push(theme.lineColor);
                    obj.colors.push(theme.color);
                    //RSLAM인 경우 object는 1, section은 0으로 
                    if (this.mapInfo.payload.type !="RSLAM") {        
                        obj.depths.push(theme.height);
                    } else {
                        if (arr.id.startsWith("SC-")) {
                            obj.depths.push(0);
                        } else {
                            obj.depths.push(1);
                        }
                    }
                    obj.title.push(arr.title);
                    //section은 하나만 담기 
                    if (arr.id.startsWith("SC-")) {
                        obj.zCords.set("section", theme.height);
                    } else {
                        obj.zCords.set(arr.id, theme.height);
                    }    
                    found = true;
                    break;				
                }
            }
            if (found==false) {
                console.log('style is not found!')
            }
        }
    }
    


    initObject ( group, svgObject ) {

        for ( var i = 0; i < svgObject.paths.length; i ++ ) {
            if (svgObject.patternUrls[i] === null) {
                this.initGeo(svgObject.paths[i], 
                svgObject.colors[i], 
                svgObject.depths[i], 
                group);
            } else {
                this.initPatternGeo(svgObject.paths[i], 
                    svgObject.colors[i], 
                    svgObject.depths[i], 
                    svgObject.patternUrls[i],
                    group);
            }
            this.initOutline(svgObject.paths[i], 
                svgObject.lineColors[i], 
                svgObject.depths[i],
                group);
        }
    }
    initGeo(path, color, depth, group){
        var path = this.$d3g.transformSVGPath( path );
        var color = new THREE.Color( color );
        
        var material = new THREE.MeshLambertMaterial( {
            color: color,
        } );
        var simpleShapes = path.toShapes( true );
        var simpleShape = simpleShapes[ 0 ];
        var shape3d = new THREE.ExtrudeBufferGeometry( simpleShape, {
            depth: depth,
            bevelEnabled: false
        } );
        //object/section 그리기
        var mesh = new THREE.Mesh( shape3d, material );
        mesh.rotation.x = Math.PI;
        mesh.translateZ( - depth  );
        mesh.translateX( - this.center.x );
        mesh.translateY( - this.center.y );
        // console.log(mesh.position)
        group.add( mesh );
        this.objects.push(mesh);
    }

    initPatternGeo(path, color, depth, patternUrl, group){
        // console.log(patternUrl);
        var loader = new THREE.TextureLoader(); 
        loader.load(patternUrl, (texture) => {
            // let key = patternUrl.split("pattern/")[1].split(".")[0];
            let splits = patternUrl.split("/");
            let key = splits[splits.length-1].split(".")[0];
            // https://assets.dabeeomaps.com/upload/demo/texture/SUB_01.jpg
            // https://demo-preview.dabeeomaps.com/image/pattern/S5.jpg

            
            let val = textureMap.get(key)
            // console.log(key, val);
            if (val == undefined ) {
                val = 0.03; 
            }
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( val, val );

            var material = new THREE.MeshBasicMaterial( {
                // color:  new THREE.Color( color ),
                map:texture,
                // transparent: true,
                // opacity: 0.8,
            } );
            var simpleShapes = this.$d3g.transformSVGPath( path ).toShapes( true );
            var simpleShape = simpleShapes[ 0 ];
            var shape3d = new THREE.ExtrudeBufferGeometry( simpleShape, {
                depth: depth,
                bevelEnabled: true,
                bevelSegments: 2, 
                steps: 2, 
                bevelSize: 1, 
                bevelThickness: 1 
            } );

            //object/section 그리기
            var mesh = new THREE.Mesh( shape3d, material );
            // var mesh= new THREE.Mesh(new THREE.BoxBufferGeometry(400,200,200), material);
            mesh.rotation.x = Math.PI;
            mesh.translateZ( - depth  );
            mesh.translateX( - this.center.x );
            mesh.translateY( - this.center.y );
            group.add( mesh );
            this.objects.push(mesh);
        })
    }

    initOutline(path, color, depth, group) { 

        //line 그리기 
        var path = this.$d3g.transformSVGPath( path );
        var simpleShapes = path.toShapes( true );
        var simpleShape = simpleShapes[ 0 ];

        var lineColor = new THREE.Color( color );
        simpleShape.autoClose = true;
        var points = simpleShape.getPoints();
        var geometryPoints = new THREE.BufferGeometry().setFromPoints( points );
        
        var lines = new THREE.Line( geometryPoints, 
            new THREE.LineBasicMaterial( { color: lineColor } ) );
        lines.rotation.x = Math.PI;``
        lines.translateZ( - depth  );
        lines.translateX( - this.center.x );
        lines.translateY( - this.center.y );
        group.add( lines );
        this.objects.push(lines);
    }

            
    initPoiTitle(zCords, defaultFloor) {
            // three.js/examples/fonts/NanumBarunGothic_Regular.json
            // loader.load("https://assets.dabeeomaps.com/upload/fonts/NanumBarunGothic_Regular.font", (font)=> {
            // loader.load( "http://demo-preview-rebuild.dabeeomaps.com/js/preview/fonts/NanumBarunGothic_Regular.font", ( font )=> {
            // loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
                var xMid, text;
                var color = 0x000000;

                var matLite = new THREE.MeshBasicMaterial( {
                    color: color,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                } );
                for (let arr of defaultFloor.pois) {
                    if (arr.displayType == 'ICON' || arr.displayType=='NONE') {
                        continue;
                    }
                    let message = arr.title;
                    // console.log("원래 fontSize " + arr.style.fontSize)
                    let fontSize = arr.style.fontSize * this.mapInfo.payload.size.width /15000 ;
                    // console.log("fontSize " + fontSize)
                    // if (fontSize <4) fontSize =4; 
                    // if (fontSize >7) fontSize =7; 
                    // console.log("조정후 fontSize " + fontSize)
                    
                    var shapes = this.font.generateShapes( message, fontSize );
                    var geometry = new THREE.ShapeBufferGeometry( shapes );
                    // make shape ( N.B. edge view not visible )

                    text = new THREE.Mesh( geometry, matLite );

                    text.position.x = this.resizeX(arr.position.x);
                    text.position.y = -this.resizeY(arr.position.y);

                    geometry.computeBoundingBox();
                    xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
                    geometry.translate( xMid-this.center.x, +this.center.y, 0 );
                    let zCord = zCords.get(arr.objectId);
                    if (zCord == undefined ) {
                        text.position.z = zCords.get("section")+2;
                        console.log(message + " is not linked with object");
                    } else {
                        text.position.z = zCord+2;
                    }
                    // console.log('text ', message, '  위치 :', text.position)
                    // scene.add( text );
                    this.poiGroup.add( text );
                    this.objects.push(text);
                } 
            // } ); //end load function
    }
    
    initPoiIcon(zCords, defaultFloor) {
        for (let arr of defaultFloor.pois) {
            if (arr.displayType == 'TITLE' || arr.displayType=='NONE') {
                continue; 
            }
            var imageLoader = new THREE.ImageLoader();
            // console.log("원래 iconSize :" + arr.iconSize.width);
            // let iconSize = arr.iconSize.width/70 * 10;
            let iconSize = arr.iconSize.width * this.mapInfo.payload.size.width /20000 ;
            // console.log("iconSize :" + iconSize);
            // if (iconSize <7)iconSize=7;
            // console.log("조정후 iconSize :" + iconSize);
            imageLoader.load( arr.iconUrl ,  ( image )=> {

                    var texture = new THREE.CanvasTexture( image );
                    var material = new THREE.MeshBasicMaterial( { 
                        //  color: 0xff8888, 
                        transparent: true,
                        opacity: 1.0,
                        // side: THREE.DoubleSide,
                        map: texture 
                    } );
                    var geometry = new THREE.PlaneGeometry( iconSize, iconSize );
                    var cube = new THREE.Mesh( geometry, material );

                    cube.position.x = this.resizeX(arr.position.x);
                    cube.position.y = -this.resizeY(arr.position.y)+10;
                    let zCord = zCords.get(arr.objectId);
                    if (zCord == undefined ) {
                        cube.position.z = zCords.get("section")+1;
                        console.log(arr.iconUrl + " is not linked with object");
                    } else {
                        cube.position.z = zCord+1;
                    }
    
                    geometry.translate(-this.center.x, + this.center.y, 0 );
                    // console.log('icon 위치 : ', cube.position)
                    this.poiGroup.add( cube );
                    this.objects.push( cube );

            } );
        }
    }


    findDefaultFloor(floorId) { 
        let floor = null;
        for (let idx = 0; idx< this.floorData.length; idx++) {
            if (this.floorData[idx].defaultYn) {
                floor = this.floorData[idx];
                break; 
            }    
        }
        for (let idx = 0; idx< this.floorData.length; idx++) {
            if (floorId == this.floorData[idx].id) {
                floor = this.floorData[idx];
                break; 
            }    
        }

        return floor; 
    }

    findDefaultTheme(themeId) {
        let theme= null; 
        for (let idx=0;  idx <this.floorTheme.length; idx++) {
            if (this.floorTheme[idx].defaultYn === true) {
                theme = this.floorTheme[idx];
                // console.log(idx)
                break;
            }
        }
        // console.log(defaultThemeId);
        for (let idx=0;  idx <this.floorTheme.length; idx++) {
            if (themeId  == this.floorTheme[idx].id) {
                theme = this.floorTheme[idx];
                // console.log(idx)
                break;
            }
        }
        return theme;
    }


    animate() {
        requestAnimationFrame( this.animate.bind(this) );
        this.controls.update();
        this.render();
        // stats.update();
    }
    render() {
        var camera = (this.params.orthographicCamera)? this.orthographicCamera : this.perspectiveCamera;
        var timer = Date.now() * 0.00005;
        var interval = 0.7; 
        

        if (this.x <= 400 && this.y <= 10) {
            this.x +=interval;
        }
        else if (this.x > 400 && this.y  < 140 ) {
            this.y+=interval;
        } 
        else if (this.y >= 140 && this.x >300)  {
            this.x -=interval;
        } 
        else if (this.x >=300 && this.y >25  ) {
            this.y-=interval; 
        } 
        else if (this.y <=25  && this.x >-200 ) {
            this.x -=interval; 
        }
        else if (this.x >= -200 &&  this.y >10) {
            this.y -=interval; 
        }

        this.particleLight.position.x = this.x;
        this.particleLight.position.y = this.y;
        this.particleLight.position.z = 20;
        // console.log(this.particleLight.position.x, this.particleLight.position.y)

        this.renderer.render( this.scene, camera );
    }
}