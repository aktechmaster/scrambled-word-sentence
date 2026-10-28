const DAFTAR_MATERI_SCRAMBLE = [
  // MODE 1: SUSUN HURUF JADI KATA (Word Scramble)
  {
    id: "vocab-past-tense",
    judul: "[Susun Huruf] Kosakata Past Tense",
    type: "word", // Menandakan susun per huruf
    lang: "en-US",
    items: [
      { target: "ENCOURAGED", hint: "Mendorong / Memberi semangat" },
      { target: "ARRIVED", hint: "Tiba / Sampai" },
      { target: "MANAGED", hint: "Mengelola / Berhasil" },
      { target: "DECIDED", hint: "Memutuskan" },
      { target: "BROUGHT", hint: "Membawa" }
    ]
  },

  // MODE 2: SUSUN KATA JADI KALIMAT (Sentence Scramble)
  {
    id: "past-tense-sentences",
    judul: "[Susun Kalimat] Kalimat Past Tense",
    type: "sentence", // Menandakan susun per kata
    lang: "en-US",
    items: [
      { target: "She walked to school yesterday", hint: "Dia berjalan ke sekolah kemarin" },
      { target: "They played football in the park", hint: "Mereka bermain sepak bola di taman" }
    ]
  }
];
