GESTURE_PROFILES = {

    "academic": {
        "description": "학교 발표 / 학술 발표",
        "scoring": {
            "base_score": 50,
            "gesture_use_weight": 0.40,
            "pointing_bonus_weight": 0.15,
            "neutral_penalty_threshold": 60,
            "neutral_penalty_rate": 0.35,
            "over_gesture_threshold": None,
            "over_gesture_penalty": 0,
        },
        "feedback": {
            "high":    "손 제스처를 적극적으로 활용하여 발표 내용을 효과적으로 전달하고 있습니다.",
            "mid":     "손 제스처를 적절히 사용하고 있습니다. 핵심 내용에서 조금 더 강조 제스처를 활용하면 좋습니다.",
            "low":     "손 제스처가 적어 발표가 다소 경직되어 보일 수 있습니다. 자료를 가리키거나 강조할 때 자연스럽게 손을 활용해 보세요.",
            "no_hand": "손이 화면에 거의 나타나지 않아 손동작을 분석하기 어렵습니다. 발표 시 손이 카메라에 보이도록 위치를 조정해 보세요.",
        }
    },

    "interview": {
        "description": "취업 면접 / 입시 면접",
        "scoring": {
            "base_score": 65,
            "gesture_use_weight": 0.10,
            "pointing_bonus_weight": 0.05,
            "neutral_penalty_threshold": 999,
            "neutral_penalty_rate": 0.0,
            "over_gesture_threshold": 40,
            "over_gesture_penalty": 0.3,
        },
        "feedback": {
            "high":    "차분하고 절제된 손동작으로 안정적인 면접 태도를 보여주고 있습니다.",
            "mid":     "전반적으로 적절한 손동작입니다. 강조가 필요한 순간에만 간결하게 사용하면 좋습니다.",
            "low":     "손동작이 다소 많아 산만해 보일 수 있습니다. 면접에서는 손을 차분히 유지하는 것이 좋습니다.",
            "no_hand": "손이 화면에 거의 나타나지 않아 분석이 어렵습니다.",
        }
    },

    "business": {
        "description": "비즈니스 / 직장 발표",
        "scoring": {
            "base_score": 55,
            "gesture_use_weight": 0.25,
            "pointing_bonus_weight": 0.10,
            "neutral_penalty_threshold": 70,
            "neutral_penalty_rate": 0.25,
            "over_gesture_threshold": 60,
            "over_gesture_penalty": 0.2,
        },
        "feedback": {
            "high":    "명확하고 자신감 있는 손동작으로 발표 내용을 잘 전달하고 있습니다.",
            "mid":     "손동작이 적절합니다. 핵심 포인트에서 조금 더 강조하면 효과적입니다.",
            "low":     "손동작을 조금 더 활용하면 청중의 집중도를 높일 수 있습니다.",
            "no_hand": "손이 화면에 거의 나타나지 않아 분석이 어렵습니다.",
        }
    },

    "speech": {
        "description": "스피치 / 대중 연설",
        "scoring": {
            "base_score": 45,
            "gesture_use_weight": 0.50,
            "pointing_bonus_weight": 0.10,
            "neutral_penalty_threshold": 40,
            "neutral_penalty_rate": 0.45,
            "over_gesture_threshold": None,
            "over_gesture_penalty": 0,
        },
        "feedback": {
            "high":    "풍부하고 생동감 있는 손동작으로 청중을 효과적으로 이끌고 있습니다.",
            "mid":     "손동작이 무난합니다. 스피치에서는 더 과감하고 큰 제스처를 활용해 보세요.",
            "low":     "손동작이 많이 부족합니다. 스피치에서는 적극적인 제스처가 설득력을 높입니다.",
            "no_hand": "손이 화면에 거의 나타나지 않아 분석이 어렵습니다.",
        }
    },
}