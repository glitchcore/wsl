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

    return `rgb(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)})`;
}

function make_noise(gl, ctx) {
    let context = new (window.AudioContext || window.webkitAudioContext)();

    let supersaw = [];

    for(let i = 0; i < 100; i++) {
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

        document.body.style.backgroundColor = hsv2rgb({h: 0, s: 0, v: det * 5});
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
        
        draw(gl, ctx, dt * det);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}
