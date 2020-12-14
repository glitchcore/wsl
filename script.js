const glsl = x => x;
const vert = x => x;
const frag = x => x;

const vsSource = vert`
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;

const fsSource = frag`
    varying lowp vec4 vColor;

    void main() {
        gl_FragColor = vColor;
    }
`;

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
  
    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
  
    return shader;
}

function init(gl) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    {
        // create and bind buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];

        // fill buffer with positions
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW
        );

        // pass buffer to GLSL
        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.vertexAttribPointer(
            vertexPosition,
            3, // pull out 3 values per iteration
            gl.FLOAT, // the data in the buffer is 32bit floats
            false,  // don't normalize
            // how many bytes to get from one set of values to the next
            // 0 = use type and numComponents above
            0,
            0, // how many bytes inside the buffer to start from)
        );
        gl.enableVertexAttribArray(vertexPosition);
    }

    {
        const faceColors = [
            [1.0,  1.0,  1.0,  1.0],    // Front face: white
            [1.0,  0.0,  0.0,  1.0],    // Back face: red
            [0.0,  1.0,  0.0,  1.0],    // Top face: green
            [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
            [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
            [1.0,  0.0,  1.0,  1.0],    // Left face: purple
        ];

        var colors = [];
        
        for (var j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];
            
            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor');
        gl.vertexAttribPointer(
            vertexColor,
            4,
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(
            vertexColor);
    }

    gl.useProgram(shaderProgram);

    // create and bind projection matrix
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
        45 * Math.PI / 180,   // fieldOfView in radians
        gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect
        0.1, // zNear
        100.0, // zFar
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        false,
        projectionMatrix);

    // create and bind mode view matrix
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate

    const rotatedMatrix = mat4.create();

    const modelViewMatrixPointer = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  

    return {
        shaderProgram,
        modelViewMatrix,
        rotatedMatrix,
        modelViewMatrixPointer,
    }
}

let cubeRotation = 2.0;

function draw(gl, ctx, dt) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.rotate(ctx.rotatedMatrix,  // destination matrix
        ctx.modelViewMatrix,  // matrix to rotate
        cubeRotation,   // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around

    mat4.rotate(ctx.rotatedMatrix,  // destination matrix
        ctx.modelViewMatrix,  // matrix to rotate
        cubeRotation,     // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around (Z)
    
    mat4.rotate(ctx.rotatedMatrix,  // destination matrix
        ctx.rotatedMatrix,  // matrix to rotate
        cubeRotation * .7,// amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around (X)

    
    gl.uniformMatrix4fv(
        ctx.modelViewMatrixPointer,
        false,
        ctx.rotatedMatrix);
    
    gl.drawElements(
        gl.TRIANGLES,
        2 * 3 * 6, // vertexCount
        gl.UNSIGNED_SHORT, // type
        0 // offset
    );

    cubeRotation += dt;
}

function main() {
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    const ctx = init(gl);

    let then = 0;
    
    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001;  // convert to seconds
        const dt = now - then;
        then = now;
        
        draw(gl, ctx, dt);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}
  
window.onload = main;
