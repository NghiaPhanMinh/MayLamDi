// ============================================================================
// GAME AUDIO & WEB PUSH NOTIFICATION ENGINE (Acoustic Web Audio Synthesizer)
// Zero external asset downloads - 100% reliable, zero latency, zero 404s
// ============================================================================

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private spellGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVolume: number = 0.98; // 98% default master volume
  private spellVolume: number = 0.97; // 97% default spell sound effects volume
  private bgmVolume: number = 1; // 100% default background music volume
  private isGameModeActive: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: any = null;
  private ambientRoarIntervalId: any = null;
  private activeBgmSources = new Set<AudioScheduledSourceNode>();

  // Active looping spell sound nodes
  private activeSpellLoop: {
    nodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[];
    gainNode: GainNode;
    spellType: string;
    timers?: any[];
  } | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("rpg_sound_muted");
      this.isMuted = savedMute === "true";
      const savedVol = localStorage.getItem("rpg_sound_volume");
      if (savedVol !== null) {
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
      const savedSpellVol = localStorage.getItem("rpg_sound_spell_volume");
      if (savedSpellVol !== null) {
        this.spellVolume = Math.max(0, Math.min(1, parseFloat(savedSpellVol)));
      }
      const savedBgmVol = localStorage.getItem("rpg_sound_bgm_volume");
      if (savedBgmVol !== null) {
        this.bgmVolume = Math.max(0, Math.min(1, parseFloat(savedBgmVol)));
      }
    }
  }

  private initContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.spellGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();

        this.masterGain.gain.setValueAtTime(
          this.isMuted || !this.isGameModeActive ? 0 : this.masterVolume,
          this.ctx.currentTime,
        );
        this.sfxGain.gain.setValueAtTime(0.70, this.ctx.currentTime);
        this.spellGain.gain.setValueAtTime(this.spellVolume, this.ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(this.bgmVolume * 0.40, this.ctx.currentTime);

        this.sfxGain.connect(this.masterGain);
        this.spellGain.connect(this.masterGain);
        this.bgmGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("rpg_sound_muted", String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(
        muted || !this.isGameModeActive ? 0 : this.masterVolume,
        this.ctx.currentTime,
      );
    }
    if (muted) {
      this.stopMedievalHeroicBgm();
    } else if (this.isGameModeActive && this.bgmVolume > 0) {
      this.startMedievalHeroicBgm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("rpg_sound_volume", String(this.masterVolume));
    }
    if (this.masterGain && this.ctx && !this.isMuted && this.isGameModeActive) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setSpellVolume(vol: number) {
    this.spellVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("rpg_sound_spell_volume", String(this.spellVolume));
    }
    if (this.spellGain && this.ctx) {
      this.spellGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.spellGain.gain.setValueAtTime(this.spellVolume, this.ctx.currentTime);
    }
  }

  public getSpellVolume(): number {
    return this.spellVolume;
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("rpg_sound_bgm_volume", String(this.bgmVolume));
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(this.bgmVolume * 0.40, this.ctx.currentTime);
    }
    if (this.bgmVolume > 0 && !this.isBgmPlaying && !this.isMuted && this.isGameModeActive) {
      this.startMedievalHeroicBgm();
    } else if (this.bgmVolume === 0 && this.isBgmPlaying) {
      this.stopMedievalHeroicBgm();
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public activateGameModeAudio() {
    this.isGameModeActive = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }

    // Every return to Progress begins a fresh pass through the looping theme.
    this.stopMedievalHeroicBgm();
    if (!this.isMuted && this.bgmVolume > 0) {
      this.startMedievalHeroicBgm();
    }
  }

  public deactivateGameModeAudio() {
    this.isGameModeActive = false;
    this.stopMedievalHeroicBgm();
    this.stopSpellLoop();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  // ============================================================================
  // 1. SATISFYING TASK SUBMIT "TING" SOUND (Crisp Crystal Bell Chime)
  // ============================================================================
  public playTing() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    const now = ctx.currentTime;
    const freqs = [1760, 2637, 3520]; // Crystal chime harmonics

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 - idx * 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  // ============================================================================
  // 2. MIGHTY LOW-BASS DRAGON ROAR (+100% Boosted Power Volume)
  // ============================================================================
  public playDragonRoar() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    const now = ctx.currentTime;

    // Layer 1: Deep Chest Sub-Rumble (Boosted 100%)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 1.8);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.96, now + 0.15); // +100% boost
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = "lowpass";
    subFilter.frequency.setValueAtTime(140, now);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 2.0);

    // Layer 2: Guttural Throat Cavity Formant (Boosted 100%)
    const throatOsc = ctx.createOscillator();
    const throatGain = ctx.createGain();
    throatOsc.type = "sawtooth";
    throatOsc.frequency.setValueAtTime(95, now);
    throatOsc.frequency.linearRampToValueAtTime(130, now + 0.25);
    throatOsc.frequency.exponentialRampToValueAtTime(45, now + 1.9);

    const formantFilter1 = ctx.createBiquadFilter();
    formantFilter1.type = "bandpass";
    formantFilter1.frequency.setValueAtTime(240, now);
    formantFilter1.Q.setValueAtTime(3.5, now);

    throatGain.gain.setValueAtTime(0, now);
    throatGain.gain.linearRampToValueAtTime(0.76, now + 0.18); // +100% boost
    throatGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    throatOsc.connect(formantFilter1);
    formantFilter1.connect(throatGain);
    throatGain.connect(this.sfxGain);

    throatOsc.start(now);
    throatOsc.stop(now + 2.0);

    // Layer 3: Cavern Breath Air Blast (Boosted 100%)
    const bufferSize = ctx.sampleRate * 2.0;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(380, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    noiseFilter.frequency.exponentialRampToValueAtTime(160, now + 1.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.64, now + 0.2); // +100% boost
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSrc.start(now);
    noiseSrc.stop(now + 2.0);
  }

  // ============================================================================
  // 3. CONTINUOUS LOOPING SPELL SOUNDS
  // ============================================================================
  public startSpellLoop(spellType: string) {
    this.stopSpellLoop();
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    const now = ctx.currentTime;
    const loopGain = ctx.createGain();
    loopGain.gain.setValueAtTime(0, now);
    loopGain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    loopGain.connect(this.spellGain || this.sfxGain);

    const nodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];
    const timers: any[] = [];

    if (spellType === "lightning" || spellType === "spark" || spellType === "all") {
      // =========================================================================
      // 1. AUDIBLE TORRENTIAL RAIN AMBIANCE (Reduced rain volume another 30%)
      // =========================================================================
      const rainLength = Math.floor(ctx.sampleRate * 3.0);
      const rainBuffer = ctx.createBuffer(2, rainLength, ctx.sampleRate);
      const leftRain = rainBuffer.getChannelData(0);
      const rightRain = rainBuffer.getChannelData(1);

      let lLast = 0;
      let rLast = 0;
      for (let i = 0; i < rainLength; i++) {
        const lWhite = Math.random() * 2 - 1;
        const rWhite = Math.random() * 2 - 1;
        const dropMod = 0.85 + 0.15 * Math.sin(i * 0.05);

        lLast = (lLast + 0.12 * lWhite) / 1.12;
        rLast = (rLast + 0.12 * rWhite) / 1.12;

        leftRain[i] = (lLast * 0.7 + lWhite * 0.3) * dropMod;
        rightRain[i] = (rLast * 0.7 + rWhite * 0.3) * dropMod;
      }

      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = rainBuffer;
      rainSrc.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "bandpass";
      rainFilter.frequency.setValueAtTime(1400, now);
      rainFilter.Q.setValueAtTime(0.7, now);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.20, now); // Reduced rain 30% further

      rainSrc.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(loopGain);
      rainSrc.start(now);
      nodes.push(rainSrc, rainFilter, rainGain);

      // =========================================================================
      // 2. CONTINUOUS HIGH-VOLTAGE ELECTROCUTION SIZZLE (Violent Arc Fry)
      // =========================================================================
      const elecLength = Math.floor(ctx.sampleRate * 2.0);
      const elecBuffer = ctx.createBuffer(1, elecLength, ctx.sampleRate);
      const elecData = elecBuffer.getChannelData(0);
      for (let i = 0; i < elecLength; i++) {
        const raw = Math.random() * 2 - 1;
        const pulse = Math.random() > 0.93 ? (Math.random() > 0.5 ? 2.4 : -2.4) : raw * 0.45;
        elecData[i] = pulse;
      }
      const elecSrc = ctx.createBufferSource();
      elecSrc.buffer = elecBuffer;
      elecSrc.loop = true;

      const elecBand = ctx.createBiquadFilter();
      elecBand.type = "bandpass";
      elecBand.frequency.setValueAtTime(2600, now);
      elecBand.Q.setValueAtTime(3.2, now);

      const elecGain = ctx.createGain();
      elecGain.gain.setValueAtTime(0.50, now);

      elecSrc.connect(elecBand);
      elecBand.connect(elecGain);
      elecGain.connect(loopGain);
      elecSrc.start(now);
      nodes.push(elecSrc, elecBand, elecGain);

      // =========================================================================
      // 3. EXPLOSIVE REALISTIC THUNDERCLAP (Deep Sonic Boom + Low Rolling Rumble)
      // =========================================================================
      const playElectricThunderZap = () => {
        if (!this.ctx || !this.activeSpellLoop) return;
        const strikeTime = this.ctx.currentTime;

        // --- A. SHARP BROADBAND THUNDERCLAP CRACK (Sonic Boom) ---
        const blastLength = Math.floor(this.ctx.sampleRate * 2.0);
        const blastBuffer = this.ctx.createBuffer(1, blastLength, this.ctx.sampleRate);
        const blastChannel = blastBuffer.getChannelData(0);
        let bOut = 0;
        for (let i = 0; i < blastLength; i++) {
          const white = Math.random() * 2 - 1;
          bOut = (bOut + 0.06 * white) / 1.06;
          // Initial supersonic pressure crack (0-40ms) + deep rolling acoustic reverberation
          const sonicCrack = 4.5 * Math.exp(-i / (this.ctx.sampleRate * 0.025));
          const lowRumble = 1.6 * Math.exp(-i / (this.ctx.sampleRate * 0.75));
          blastChannel[i] = bOut * (sonicCrack + lowRumble);
        }
        const blastSrc = this.ctx.createBufferSource();
        blastSrc.buffer = blastBuffer;

        const blastLp = this.ctx.createBiquadFilter();
        blastLp.type = "lowpass";
        blastLp.frequency.setValueAtTime(420, strikeTime);
        blastLp.frequency.exponentialRampToValueAtTime(55, strikeTime + 1.8);
        blastLp.Q.setValueAtTime(0.8, strikeTime);

        const blastGain = this.ctx.createGain();
        blastGain.gain.setValueAtTime(1.20, strikeTime);
        blastGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 1.9);

        blastSrc.connect(blastLp);
        blastLp.connect(blastGain);
        blastGain.connect(loopGain);
        blastSrc.start(strikeTime);

        // --- B. POST-STRIKE RESIDUAL ELECTROCUTION SIZZLE (0.12s to 0.78s after impact) ---
        const postArcLength = Math.floor(this.ctx.sampleRate * 0.65);
        const postArcBuf = this.ctx.createBuffer(1, postArcLength, this.ctx.sampleRate);
        const postArcData = postArcBuf.getChannelData(0);
        for (let i = 0; i < postArcLength; i++) {
          const raw = Math.random() * 2 - 1;
          const crackle = Math.random() > 0.94 ? 2.5 : raw * 0.5;
          postArcData[i] = crackle * (1 - i / postArcLength);
        }
        const postArcSrc = this.ctx.createBufferSource();
        postArcSrc.buffer = postArcBuf;

        const postArcBand = this.ctx.createBiquadFilter();
        postArcBand.type = "bandpass";
        postArcBand.frequency.setValueAtTime(3200, strikeTime + 0.12);
        postArcBand.Q.setValueAtTime(4.0, strikeTime + 0.12);

        const postArcGain = this.ctx.createGain();
        postArcGain.gain.setValueAtTime(0, strikeTime + 0.12);
        postArcGain.gain.linearRampToValueAtTime(0.65, strikeTime + 0.18);
        postArcGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.75);

        postArcSrc.connect(postArcBand);
        postArcBand.connect(postArcGain);
        postArcGain.connect(loopGain);
        postArcSrc.start(strikeTime + 0.12);

        // --- C. RAPID MULTI-STAGE ARCS (Target Electrocuting Bursts) ---
        const burstTimes = [0, 0.02, 0.06, 0.12, 0.19, 0.28, 0.38, 0.50, 0.62];
        burstTimes.forEach((delay, idx) => {
          const t = strikeTime + delay;
          const arcLength = Math.floor(this.ctx!.sampleRate * 0.04);
          const arcBuf = this.ctx!.createBuffer(1, arcLength, this.ctx!.sampleRate);
          const arcData = arcBuf.getChannelData(0);
          for (let i = 0; i < arcLength; i++) {
            arcData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx!.sampleRate * 0.012));
          }
          const arcSrc = this.ctx!.createBufferSource();
          arcSrc.buffer = arcBuf;

          const arcFilter = this.ctx!.createBiquadFilter();
          arcFilter.type = "bandpass";
          arcFilter.frequency.setValueAtTime(2000 + idx * 250, t);
          arcFilter.Q.setValueAtTime(3.8, t);

          const arcGain = this.ctx!.createGain();
          arcGain.gain.setValueAtTime(0.55, t);
          arcGain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

          arcSrc.connect(arcFilter);
          arcFilter.connect(arcGain);
          arcGain.connect(loopGain);
          arcSrc.start(t);
        });
      };

      playElectricThunderZap();
      const timerThunder = setInterval(playElectricThunderZap, 880); // More frequent thunder strikes (880ms cadence)
      timers.push(timerThunder);
    } else if (spellType === "ice" || spellType === "water") {
      // REALISTIC SUB-ZERO FREEZING & ICE CRACKING
      // 1. Chilling Arctic Wind
      const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const windData = windBuffer.getChannelData(0);
      let lastW = 0;
      for (let i = 0; i < windData.length; i++) {
        const white = Math.random() * 2 - 1;
        windData[i] = (lastW + 0.02 * white) / 1.02;
        lastW = windData[i];
      }
      const wind = ctx.createBufferSource();
      wind.buffer = windBuffer;
      wind.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.setValueAtTime(650, now);
      windFilter.Q.setValueAtTime(2.0, now);

      wind.connect(windFilter);
      windFilter.connect(loopGain);
      wind.start(now);
      nodes.push(wind, windFilter);

      // 2. Periodic Sharp Ice Cracking Shards
      const playIceCrack = () => {
        if (!this.ctx || !this.activeSpellLoop) return;
        const crackTime = this.ctx.currentTime;
        const freqs = [2800, 3600, 4400];
        freqs.forEach((f) => {
          const osc = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f + (Math.random() * 400 - 200), crackTime);

          g.gain.setValueAtTime(0, crackTime);
          g.gain.linearRampToValueAtTime(0.08, crackTime + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0001, crackTime + 0.12);

          osc.connect(g);
          g.connect(loopGain);
          osc.start(crackTime);
          osc.stop(crackTime + 0.14);
        });
      };

      playIceCrack();
      const timerCrack = setInterval(playIceCrack, 450);
      timers.push(timerCrack);
    } else if (spellType === "fire") {
      // TURBULENT COMBUSTION FLAME WHOOSH & POPPING CRACKLE
      const fireBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = fireBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const fire = ctx.createBufferSource();
      fire.buffer = fireBuffer;
      fire.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(280, now);
      filter.Q.setValueAtTime(1.4, now);

      fire.connect(filter);
      filter.connect(loopGain);
      fire.start(now);
      nodes.push(fire, filter);
    }

    this.activeSpellLoop = {
      nodes,
      gainNode: loopGain,
      spellType,
      timers,
    };
  }

  public stopSpellLoop() {
    if (!this.activeSpellLoop || !this.ctx) return;
    const { nodes, gainNode, timers } = this.activeSpellLoop;
    const now = this.ctx.currentTime;

    if (timers) {
      timers.forEach((t) => clearInterval(t));
    }

    try {
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.12);
      setTimeout(() => {
        nodes.forEach((n: any) => {
          try {
            if (typeof n.stop === "function") n.stop();
            if (typeof n.disconnect === "function") n.disconnect();
          } catch {}
        });
      }, 150);
    } catch {}

    this.activeSpellLoop = null;
  }

  public playLightning(durationMs: number = 1600) {
    this.startSpellLoop("lightning");
    setTimeout(() => this.stopSpellLoop(), durationMs);
  }

  public playFreeze(durationMs: number = 1600) {
    this.startSpellLoop("ice");
    setTimeout(() => this.stopSpellLoop(), durationMs);
  }

  public playFireBurn(durationMs: number = 1600) {
    this.startSpellLoop("fire");
    setTimeout(() => this.stopSpellLoop(), durationMs);
  }

  // ============================================================================
  // NON-LOOPING ELEMENTAL PROJECTILE AUDIO (Electric Zap, Burn Pop, Ice Crack)
  // ============================================================================
  public playElectricZap() {
    const ctx = this.initContext();
    const dest = this.spellGain || this.sfxGain;
    if (!ctx || !dest || this.isMuted) return;
    const now = ctx.currentTime;

    // 1. Descending Sawtooth Voltage Discharge
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.frequency.setValueAtTime(2600, now);
    bpFilter.Q.setValueAtTime(2.5, now);

    osc.connect(bpFilter);
    bpFilter.connect(oscGain);
    oscGain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.15);

    // 2. High-Frequency Electric Spark Noise Burst
    const burstLen = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, burstLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < burstLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(now);
  }

  public playBurnPop() {
    const ctx = this.initContext();
    const dest = this.spellGain || this.sfxGain;
    if (!ctx || !dest || this.isMuted) return;
    const now = ctx.currentTime;

    // Layer 1: Sub-Bass Fireball Detonation Boom ("WHUMP-BOOM")
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = "triangle";
    boomOsc.frequency.setValueAtTime(170, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.38);

    boomGain.gain.setValueAtTime(0, now);
    boomGain.gain.linearRampToValueAtTime(0.75, now + 0.015);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    const boomFilter = ctx.createBiquadFilter();
    boomFilter.type = "lowpass";
    boomFilter.frequency.setValueAtTime(240, now);

    boomOsc.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(dest);
    boomOsc.start(now);
    boomOsc.stop(now + 0.48);

    // Layer 2: Rushing Turbulent Flame Combustion Whoosh ("FWHHOOOOSHHH")
    const flameDuration = 0.55;
    const flameBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * flameDuration), ctx.sampleRate);
    const flameData = flameBuffer.getChannelData(0);
    let lastNoise = 0;
    for (let i = 0; i < flameData.length; i++) {
      const white = Math.random() * 2 - 1;
      flameData[i] = (lastNoise + 0.07 * white) / 1.07;
      lastNoise = flameData[i];
    }
    const flameSrc = ctx.createBufferSource();
    flameSrc.buffer = flameBuffer;

    const flameFilter = ctx.createBiquadFilter();
    flameFilter.type = "bandpass";
    flameFilter.frequency.setValueAtTime(650, now);
    flameFilter.frequency.exponentialRampToValueAtTime(220, now + 0.42);
    flameFilter.Q.setValueAtTime(1.8, now);

    const flameGain = ctx.createGain();
    flameGain.gain.setValueAtTime(0, now);
    flameGain.gain.linearRampToValueAtTime(0.70, now + 0.04);
    flameGain.gain.exponentialRampToValueAtTime(0.001, now + 0.54);

    flameSrc.connect(flameFilter);
    flameFilter.connect(flameGain);
    flameGain.connect(dest);
    flameSrc.start(now);

    // Layer 3: Sizzling Fiery Embers & Spark Crackles (Randomized snaps)
    const crackleTimes = [0.05, 0.11, 0.18, 0.25, 0.33, 0.42];
    crackleTimes.forEach((delay, idx) => {
      const crackleLen = Math.floor(ctx.sampleRate * 0.015);
      const crackleBuffer = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
      const cData = crackleBuffer.getChannelData(0);
      for (let j = 0; j < crackleLen; j++) {
        cData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.003));
      }
      const cSrc = ctx.createBufferSource();
      cSrc.buffer = crackleBuffer;

      const cFilter = ctx.createBiquadFilter();
      cFilter.type = "highpass";
      cFilter.frequency.setValueAtTime(1800 + Math.random() * 1400, now + delay);

      const cGain = ctx.createGain();
      cGain.gain.setValueAtTime(0.30 - idx * 0.035, now + delay);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.014);

      cSrc.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(dest);
      cSrc.start(now + delay);
    });
  }

  public playIceCrack() {
    const ctx = this.initContext();
    const dest = this.spellGain || this.sfxGain;
    if (!ctx || !dest || this.isMuted) return;
    const now = ctx.currentTime;

    // 1. Brittle High Crystalline Crack Harmonics
    const freqs = [3200, 4200, 5400];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.3 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.13);
    });

    // 2. Sharp Ice Snap Friction Click
    const snapLen = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, snapLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < snapLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
    }
    const snap = ctx.createBufferSource();
    snap.buffer = buffer;
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0.45, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snap.connect(sGain);
    sGain.connect(dest);
    snap.start(now);
  }

  public playArcaneSpark() {
    const ctx = this.initContext();
    const dest = this.spellGain || this.sfxGain;
    if (!ctx || !dest || this.isMuted) return;
    const now = ctx.currentTime;

    const notes = [1320, 1760, 2640];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);

      gain.gain.setValueAtTime(0.2, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.02);
      osc.stop(now + 0.25);
    });
  }

  public playProjectileSound(spellType?: string) {
    const type = (spellType || "lightning").toLowerCase();
    if (type === "fire") {
      this.playBurnPop();
    } else if (type === "ice" || type === "water") {
      this.playIceCrack();
    } else if (type === "lightning" || type === "spark") {
      this.playElectricZap();
    } else {
      this.playArcaneSpark();
    }
  }

  // ============================================================================
  // 4. HEROIC FANFARE MELODY (Triumphant Victory Melodic Fanfare)
  // ============================================================================
  public playHeroicMelody() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;

    const now = ctx.currentTime;
    const fanfareNotes = [
      { freq: 293.66, start: 0.0, dur: 0.22 }, // D4
      { freq: 369.99, start: 0.22, dur: 0.22 }, // F#4
      { freq: 440.0, start: 0.44, dur: 0.28 }, // A4
      { freq: 587.33, start: 0.72, dur: 0.55 }, // D5
      { freq: 554.37, start: 1.27, dur: 0.24 }, // C#5
      { freq: 587.33, start: 1.51, dur: 1.4 },  // D5 sustain
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      const brassFilter = ctx.createBiquadFilter();
      brassFilter.type = "lowpass";
      brassFilter.frequency.setValueAtTime(1600, now + n.start);

      gain.gain.setValueAtTime(0, now + n.start);
      gain.gain.linearRampToValueAtTime(0.22, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(brassFilter);
      brassFilter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  }

  // ============================================================================
  // 5. ADVENTUROUS HEROIC MEDIEVAL BGM (Inspiring Trumpet Horns, Lute & War Drums)
  // ============================================================================
  public startMedievalHeroicBgm() {
    if (this.isBgmPlaying || !this.isGameModeActive || this.isMuted || this.bgmVolume <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isBgmPlaying = true;
    let step = 0;

    // Upbeat, inspiring adventurous medieval theme in D Major (D4 -> G4 -> A4 -> D4)
    const luteChords = [
      293.66, 293.66, 392.00, 392.00, // D4 -> G4
      440.00, 440.00, 293.66, 293.66, // A4 -> D4
      246.94, 246.94, 392.00, 392.00, // B3 -> G4
      440.00, 440.00, 293.66, 293.66, // A4 -> D4
    ];

    const trumpetMelody = [
      293.66, 369.99, 440.00, 493.88, // D4, F#4, A4, B4 (Heroic Ascent)
      440.00, 587.33, 440.00, 369.99, // A4, D5, A4, F#4 (Triumphant Call)
      493.88, 440.00, 369.99, 329.63, // B4, A4, F#4, E4 (Adventurous Stride)
      369.99, 440.00, 587.33, 587.33, // F#4, A4, D5 (Grand Finale)
    ];

    const playHeroicBeat = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const now = this.ctx.currentTime;
      const beatIdx = step % 16;

      // 1. Acoustic Lute Chords (Light Plucked Strum, No Muddy Bass)
      const chordRoot = luteChords[beatIdx];
      [chordRoot, chordRoot * 1.25, chordRoot * 1.5].forEach((freq, noteIdx) => {
        const luteOsc = this.ctx!.createOscillator();
        const luteGain = this.ctx!.createGain();
        luteOsc.type = "triangle";
        luteOsc.frequency.setValueAtTime(freq, now + noteIdx * 0.02);

        luteGain.gain.setValueAtTime(0, now + noteIdx * 0.02);
        luteGain.gain.linearRampToValueAtTime(0.06, now + noteIdx * 0.02 + 0.015);
        luteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteIdx * 0.02 + 0.35);

        luteOsc.connect(luteGain);
        luteGain.connect(this.bgmGain!);

        this.activeBgmSources.add(luteOsc);
        luteOsc.onended = () => this.activeBgmSources.delete(luteOsc);
        luteOsc.start(now + noteIdx * 0.02);
        luteOsc.stop(now + noteIdx * 0.02 + 0.4);
      });

      // 2. Inspiring Medieval Horn / Trumpet Lead
      const hornFreq = trumpetMelody[beatIdx];
      const hornOsc = this.ctx.createOscillator();
      const hornGain = this.ctx.createGain();
      hornOsc.type = "triangle";
      hornOsc.frequency.setValueAtTime(hornFreq, now);

      const hornFilter = this.ctx.createBiquadFilter();
      hornFilter.type = "lowpass";
      hornFilter.frequency.setValueAtTime(1600, now);

      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.linearRampToValueAtTime(0.10, now + 0.025);
      hornGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      hornOsc.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(this.bgmGain);

      this.activeBgmSources.add(hornOsc);
      hornOsc.onended = () => this.activeBgmSources.delete(hornOsc);
      hornOsc.start(now);
      hornOsc.stop(now + 0.30);

      // 3. Light Acoustic Marching Tap (Crisp, High-Clarity)
      if (beatIdx % 2 === 1) {
        const snareBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
        const snareData = snareBuffer.getChannelData(0);
        for (let i = 0; i < snareData.length; i++) {
          snareData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
        }
        const snare = this.ctx.createBufferSource();
        snare.buffer = snareBuffer;
        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.08, now);

        snare.connect(snareGain);
        snareGain.connect(this.bgmGain);
        this.activeBgmSources.add(snare);
        snare.onended = () => this.activeBgmSources.delete(snare);
        snare.start(now);
      }

      step++;
    };

    playHeroicBeat();
    this.bgmIntervalId = setInterval(playHeroicBeat, 275); // ~110 BPM inspiring march tempo

    // Periodic Ambient Roar every 1 minute
    if (!this.ambientRoarIntervalId) {
      this.ambientRoarIntervalId = setInterval(() => {
        if (this.isBgmPlaying && !this.isMuted) {
          this.playDragonRoar();
        }
      }, 60000);
    }
  }

  public stopMedievalHeroicBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.ambientRoarIntervalId) {
      clearInterval(this.ambientRoarIntervalId);
      this.ambientRoarIntervalId = null;
    }
    this.activeBgmSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // A source may already have ended while the game tab was closing.
      }
    });
    this.activeBgmSources.clear();
  }

  public isBgmActive(): boolean {
    return this.isBgmPlaying;
  }
}

export const gameAudio = new GameAudioEngine();

// ============================================================================
// WEB PUSH NOTIFICATION & DEADLINE REMINDER MANAGER
// ============================================================================

export async function requestWebPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem("rpg_push_notifications_enabled", "true");
      return true;
    } else {
      localStorage.setItem("rpg_push_notifications_enabled", "false");
      return false;
    }
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return false;
  }
}

export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted" && localStorage.getItem("rpg_push_notifications_enabled") === "true";
}

export function sendWebNotification(title: string, body: string, soundType?: "ting" | "roar" | "fanfare") {
  if (typeof window === "undefined") return;

  // Play sound effect
  if (soundType === "roar") {
    gameAudio.playDragonRoar();
  } else if (soundType === "fanfare") {
    gameAudio.playHeroicMelody();
  } else if (soundType === "ting") {
    gameAudio.playTing();
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        requireInteraction: true, // Keep notification visible until user interacts with it
        silent: false,
      });
    } catch (err) {
      console.warn("Desktop notification suppressed or error:", err);
    }
  }
}
