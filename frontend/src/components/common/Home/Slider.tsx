import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image1 from "../../../assets/img/img1.jpg";
import Image2 from "../../../assets/img/img2.png";
import Image3 from "../../../assets/img/img3.jpg";
import Image4 from "../../../assets/img/img4.jpg";

const CADRE_SLIDE = "aspect-[1100/661] w-full rounded-lg object-cover";
// img2 est carrée : rognée par le cadre, elle perdrait ses bords ; elle y est
// centrée entière, sur le fond du thème plutôt qu'un vide.
const CADRE_SLIDE_CARRE =
  "aspect-[1100/661] w-full rounded-lg object-contain bg-surface-alt";

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
              alt="Équipe échangeant autour d'une table dans un espace de travail partagé"
              className={CADRE_SLIDE}
            />
          </div>
          <div className="embla__slide">
            <img
              src={Image2}
              alt="Composition graphique de carrés violets superposés autour d'un carré rose"
              className={CADRE_SLIDE_CARRE}
            />
          </div>
          <div className="embla__slide">
            <img
              src={Image3}
              alt="Ordinateur portable affichant du code sur un bureau lumineux"
              className={CADRE_SLIDE}
            />
          </div>
          <div className="embla__slide">
            <img
              src={Image4}
              alt="Vagues abstraites aux teintes violettes, bleues et orangées"
              className={CADRE_SLIDE}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goToPrev}
          disabled={!canPrev}
          aria-label="Slide précédente"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-alt text-ink transition-all duration-200 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canNext}
          aria-label="Slide suivante"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-alt text-ink transition-all duration-200 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

export default Slider;
