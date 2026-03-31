export const speak = (text) => {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }, 100);
};
