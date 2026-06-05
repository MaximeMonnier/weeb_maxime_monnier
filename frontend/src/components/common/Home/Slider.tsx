import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImageBanner from "../../../assets/img/img1.png";

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
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide">
            <img
              src={ImageBanner}
              alt="Image de présentation"
              className="rounded-lg"
            />
          </div>
          <div className="embla__slide">
            <img
              src={ImageBanner}
              alt="Image de présentation"
              className="rounded-lg"
            />
          </div>
          <div className="embla__slide">
            <img
              src={ImageBanner}
              alt="Image de présentation"
              className="rounded-lg"
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-secondary text-primary transition-all duration-200 hover:bg-tertiary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canNext}
          aria-label="Slide suivante"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-secondary text-primary transition-all duration-200 hover:bg-tertiary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]"
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
};

export default Slider;
