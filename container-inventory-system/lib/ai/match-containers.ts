import { PedimentoData } from "./extract-pedimento";

export interface ContainerMatch {
  seriesNumber: string;
  status: "exact" | "no_match" | "multiple";
  pedimentoNumber?: string;
  pedimentoNumbers?: string[];
}

export function matchContainersToPedimentos(
  containerNumbers: string[],
  pedimentos: PedimentoData[]
): ContainerMatch[] {
  return containerNumbers.map((seriesNumber) => {
    const matchingPedimentos = pedimentos.filter((p) =>
      p.containerNumbers.some(
        (cn) => cn.toUpperCase() === seriesNumber.toUpperCase()
      )
    );

    if (matchingPedimentos.length === 1) {
      return {
        seriesNumber,
        status: "exact" as const,
        pedimentoNumber: matchingPedimentos[0].pedimentoNumber,
      };
    } else if (matchingPedimentos.length > 1) {
      return {
        seriesNumber,
        status: "multiple" as const,
        pedimentoNumbers: matchingPedimentos.map((p) => p.pedimentoNumber),
      };
    } else {
      return {
        seriesNumber,
        status: "no_match" as const,
      };
    }
  });
}
