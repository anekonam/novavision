namespace NovaVision.Core.Enums;

/// <summary>
/// NEC uses a cancellation task with 4 stages, each with different target/distractor shapes.
/// Stage 0: Target=Diamonds, Distractors=Circles+Crosses
/// Stage 1: Target=Diamonds, Distractors=Circles+Crosses
/// Stage 2: Target=Stars, Distractors=Diamonds+Crosses
/// Stage 3: Target=Circles, Distractors=Diamonds+Crosses
/// </summary>
public enum NecStage
{
    Stage0 = 0,
    Stage1 = 1,
    Stage2 = 2,
    Stage3 = 3
}
