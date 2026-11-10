import api from './api'

/** Best-effort analytics: tracking failures must not block the user's flow. */
export function trackStageButtonClick(
  userId: string | undefined,
  stage: number,
  sisModule: 'SIS_CHECK' | 'SIS_CLEAR',
  buttonKey: string,
  buttonLabel: string,
  target?: string,
) {
  if (!userId) return
  void api.post('/engagement/stage-button-click', { userId, stage, sisModule, buttonKey, buttonLabel, target })
    .catch((error) => console.error('Failed to track stage button click:', error))
}
