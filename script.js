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

function draw(gl) {
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

    
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {
        // create and bind buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            -1.0,  1.0,
            1.0,  1.0,
            -1.0, -1.0,
            1.0, -1.0,
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
            2, // pull out 2 values per iteration
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
        const colors = [
            1.0,  1.0,  1.0,  1.0,    // white
            1.0,  0.0,  0.0,  1.0,    // red
            0.0,  1.0,  0.0,  1.0,    // green
            0.0,  0.0,  1.0,  1.0,    // blue
        ];

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
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        false,
        modelViewMatrix);

    {
        // draw shader
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
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

    // draw2(gl);
    draw(gl);
}
  
window.onload = main;
