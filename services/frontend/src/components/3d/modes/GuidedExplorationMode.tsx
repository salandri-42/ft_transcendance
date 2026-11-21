import { useGuidedInput } from './hooks/useGuidedInput';
import { useGuidedCamera } from './hooks/useGuidedCamera';

/**
 * 
 * @description Mode de navigation guidée. Orchestre les entrées et l'animation de la caméra.
 * 
 */
export function GuidedExplorationMode()
{
	useGuidedInput();
	useGuidedCamera();

	return null;
}
