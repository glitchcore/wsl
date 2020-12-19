let hsv2rgb = (hsv) => {
    let rgb = {};
    let h = Math.round(hsv.h);
    let s = Math.round(hsv.s * 255 / 100);
    let v = Math.round(hsv.v * 255 / 100);

    if (s == 0) {
        rgb.r = rgb.g = rgb.b = v;
    } else {
        let t1 = v;
        let t2 = (255 - s) * v / 255;
        let t3 = (t1 - t2) * (h % 60) / 60;

        if (h == 360) h = 0;

        if (h < 60) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3 }
        else if (h < 120) { rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3 }
        else if (h < 180) { rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3 }
        else if (h < 240) { rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3 }
        else if (h < 300) { rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3 }
        else if (h < 360) { rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3 }
        else { rgb.r = 0; rgb.g = 0; rgb.b = 0 }
    }

    return rgb;
}

let cubeRotation = 2.0;

function draw(gl, ctx, dt, color) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // Set clear color to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {
        const faceColors = [0, 30, 50, 70, 90, 120]
            .map(x => hsv2rgb({h: (x + color) % 360, s: 50, v: 50}))
            .map(x => [x.r/255, x.g/255, x.b/255, 1.0]);

        var colors = [];
        
        for (var j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];
            
            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        const vertexColor = gl.getAttribLocation(ctx.shaderProgram, 'aVertexColor');
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

function make_noise(gl, ctx) {
    let context = new (window.AudioContext || window.webkitAudioContext)();

    let supersaw = [];

    for(let i = 0; i < 20; i++) {
        let oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 220;

        supersaw.push(oscillator);
    }

    let low_pass = context.createBiquadFilter();
    low_pass.type = "lowpass";
    low_pass.frequency.value = 2000;
    low_pass.Q.value = 0.7;

    let bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 330;
    bandpass.Q.value = 0.7;

    const fund = 80;
    const freqs = [fund * 3/2, fund * 4/3, fund * 3/2, fund * 5/4];
    let idx = 0;

    let d = 2;
    let next_d = 2;

    let det = 0;
    setInterval(() => {
        next_d++;
        if(next_d == 6) {
            next_d = 2;
        }
    }, 10000);

    let t = 0;
    setInterval(() => {
        t += 20;

        d += (next_d - d) * 0.03;

        if(Math.abs(next_d - d) < 0.2) {
            det += 0.02;
        } else {
            det = Math.abs(next_d - d) / 0.2;
        }

        supersaw.forEach((x, i, a) => 
            x.frequency.value = freqs[idx] * (i % (4*d)) / 4 +
                Math.sin(t / 1000 + i/a.length * Math.PI) * det
        );

        let rgb = hsv2rgb({h: 0, s: 0, v: det * 5});
        document.body.style.backgroundColor = 
        `rgb(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)})`;
        
        bandpass.frequency.value = 100 + det * 100;
    }, 20);

    supersaw.forEach(x => x.start());

    supersaw.forEach((x,i,a) => {
        let gain = context.createGain();
        gain.gain.value = 1/a.length;
        x.connect(gain);
        gain.connect(low_pass);
    });
    low_pass.connect(bandpass);
    low_pass.connect(context.destination);

    let then = 0;
    
    // Draw the scene repeatedly
    function render(now) {
        now *= 0.001;  // convert to seconds
        const dt = now - then;
        then = now;
        
        draw(gl, ctx, dt * det / 2, d * 100);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}
