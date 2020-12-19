function make_noise() {
    let context = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 440;

    let low_pass = context.createBiquadFilter();
    low_pass.type = "lowpass";
    low_pass.frequency.value = 880;
    low_pass.Q.value = 0.7;

    const freqs = [220, 55, 440, 330, 55, 440, 110, 55, 110];
    let idx = 0;

    setInterval(() => {
        if(low_pass.frequency.value > 30) {
            low_pass.frequency.value -= 15;
        } else {
            low_pass.frequency.value = 880;
            oscillator.frequency.value = freqs[idx];
            idx++;
            if(idx == freqs.length) {
                idx = 0;
            }
            if(idx < freqs.length / 2) {
                document.body.style.backgroundColor = "black";
            } else {
                document.body.style.backgroundColor = "red";
            }
        }
    }, 1);

    oscillator.start();

    oscillator.connect(low_pass);
    low_pass.connect(context.destination);
    
    
}
