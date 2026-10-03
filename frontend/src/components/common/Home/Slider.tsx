import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image1 from "../../../assets/img/img1.png";
import Image2 from "../../../assets/img/img2.png";

// Les deux images n'ont pas le même format : le cadre prend celui d'img1 et
// img2 y est centrée entière, sur le fond du thème plutôt qu'un vide.
const CADRE_SLIDE =
  "aspect-[1100/661] w-full rounded-lg object-contain bg-[var(--color-light-bg-secondary)] dark:bg-[var(--color-dark-bg-secondary)]";

const Slider = () => {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [
    autoplay.current,
  ]);

  const goToPrev = () => emblaApi?.scrollPrev();
  const goToNext = () => emblaApi?.scrollNext();

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };

    emblaApi.plugins().autoplay?.play();
    updateButtons();

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="embla w-full max-w-[1100px]">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide">
            <img
              src={Image1}
              alt="Maquette d'une interface de blog : menu latéral, blocs de texte et cartes illustrées"
              className={CADRE_SLIDE}
            />
          </div>
          <div className="embla__slide">
            <img
              src={Image2}
              alt="Composition graphique de carrés violets superposés autour d'un carré rose"
              className={CADRE_SLIDE}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
      {/* Les deux flèches épellent leur fond au lieu de porter `bg-secondary` :
          `.dark .bg-secondary` pèse autant que le survol sombre et est écrite
          après lui, donc elle gagnait et le survol ne se voyait pas. */}
        <button
          type="button"
          onClick={goToPrev}
          disabled={!canPrev}
          aria-label="Slide précédente"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-[var(--color-light-bg-secondary)] dark:bg-[var(--color-dark-bg-secondary)] text-primary transition-all duration-200 hover:bg-[var(--color-light-bg-tertiary)] dark:hover:bg-[var(--color-dark-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canNext}
          aria-label="Slide suivante"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-[var(--color-light-bg-secondary)] dark:bg-[var(--color-dark-bg-secondary)] text-primary transition-all duration-200 hover:bg-[var(--color-light-bg-tertiary)] dark:hover:bg-[var(--color-dark-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]"
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

export default Slider;
