## [1.3.1](https://github.com/Fx64b/learn/compare/v1.3.0...v1.3.1) (2025-05-10)


### Bug Fixes

* **layout:** update ThemeProvider import and remove RateLimitStatus from layout ([ff2e9b0](https://github.com/Fx64b/learn/commit/ff2e9b06a2ea00144a4c73534b163e6b3b0beba6))
* **learning-progress-chart:** include month in date display for improved clarity ([3cc7ea3](https://github.com/Fx64b/learn/commit/3cc7ea3b7f5a4e210ab40fe695efccdc96d8614e))
* **lern-modus:** replace RotateCw icon with Shuffle icon for better clarity ([5fd8bc0](https://github.com/Fx64b/learn/commit/5fd8bc0c489e8820b95f1733dd71795b7006322a))
* **lern-modus:** shuffle flashcards by default to improve learning experience ([fce9e6f](https://github.com/Fx64b/learn/commit/fce9e6f3d83e2760fc8b9548d57d3bd3e2db3574))
* **progress:** correctly calculate study streak including yesterday's review ([787e9d3](https://github.com/Fx64b/learn/commit/787e9d3aec8c5aadef7c6612d0c2657b3dfab2dd))

# [1.3.0](https://github.com/Fx64b/learn/compare/v1.2.0...v1.3.0) (2025-05-09)

### Bug Fixes

- **dashboard:** update progress-dashboard layout to be more responsive ([683e839](https://github.com/Fx64b/learn/commit/683e8395e4fdcb96a4a00abb5bfb33dd04b25464))
- **footer, layout:** clean up imports and improve code formatting for consistency ([bb5fab2](https://github.com/Fx64b/learn/commit/bb5fab248df4adec0f6c2b381aeeef6cb34b013d))
- **footer:** minor bugfix and refactoring ([1630816](https://github.com/Fx64b/learn/commit/1630816bc390df3804019e648afdbf9903054db8))
- **learning-progress-chart:** adjust grid gap for improved layout consistency ([9441565](https://github.com/Fx64b/learn/commit/9441565eeb4a3a4e34d0b091cd25a9f2ec938260))
- **lern-modus:** remove unused deck title prop and streamline LernModusClient component ([06413ce](https://github.com/Fx64b/learn/commit/06413ce7f0dc39212024524b6d412ce67c7ad57c))
- **lern-modus:** update empty state messages and improve layout for better user experience ([df04fef](https://github.com/Fx64b/learn/commit/df04fef1c6d04cf6d8a586e56b07c48d84fd31a8))
- **review:** validate rating input and improve review card logic ([b6ec73b](https://github.com/Fx64b/learn/commit/b6ec73b77ed2f1b9ff1cca306a27757fbe37b4bc))
- **styles:** remove mobile button height adjustment and update package dependencies ([f1ef9bf](https://github.com/Fx64b/learn/commit/f1ef9bf1c94d57c8c760b32e191c83354f3ad2f8))
- **utils:** enhance getDueCards function to include review metadata and improve query logic ([8cca9a7](https://github.com/Fx64b/learn/commit/8cca9a731635e64d679d3f19a21ed071717d5e06))

### Features

- **progress-dashboard:** enhance learning progress visualization with detailed statistics and improved layout ([3d9b006](https://github.com/Fx64b/learn/commit/3d9b006206962001606c2672fbbcb156bdb170a9))

# [1.2.0](https://github.com/Fx64b/learn/compare/v1.1.0...v1.2.0) (2025-05-07)

### Bug Fixes

- **layout:** ensure main content has minimum height for better layout consistency ([67cd637](https://github.com/Fx64b/learn/commit/67cd6376d56564c8522c06c4442a4211bb05e786))

### Features

- enhance profile settings with tabs for user preferences and progress statistics ([5aeea18](https://github.com/Fx64b/learn/commit/5aeea18901a0934d1194ec690bf892cea9da0d06))
- **footer:** add footer component with version and license links ([5499571](https://github.com/Fx64b/learn/commit/54995715fae1771060ca9f82f602d4c2b604e8e9))
- implement user preferences management and theme provider (WIP) ([a63257a](https://github.com/Fx64b/learn/commit/a63257a182c420f415fc45c36454bda5a64e2585))
- **profile:** improve user preferences management with local state and animation settings ([9080c8a](https://github.com/Fx64b/learn/commit/9080c8adbc8838a82bebe1bf898b60fdf521958e))

# [1.1.0](https://github.com/Fx64b/learn/compare/v1.0.0...v1.1.0) (2025-05-06)

### Bug Fixes

- simplify timeOfDay data structure and ensure rawData is always returned in error cases ([e72877d](https://github.com/Fx64b/learn/commit/e72877d0c411ffebacedde546e499ef57a2fabc4))
- typo ([464ca7f](https://github.com/Fx64b/learn/commit/464ca7f8c3f8182d2c80a57f318dca3ca78ca1d6))

### Features

- add semantic release configuration and GitHub Actions workflow ([d02c3fb](https://github.com/Fx64b/learn/commit/d02c3fb6f28c9d9752e0557ced34e8de7d417913))
- enhance flashcard retrieval with user-specific filtering and improve progress tracking ([3b88bb5](https://github.com/Fx64b/learn/commit/3b88bb500b0177ab8584125298e49b601206af19))
- implement auto-save functionality for study sessions and update data structure for time analysis ([f42727e](https://github.com/Fx64b/learn/commit/f42727e81553ac25a1db50f230fd8e159e58ae8b))
- improve general responsiveness and mobile layout ([99ea481](https://github.com/Fx64b/learn/commit/99ea481fc7df889511790a6740d4a7b728e13f76))
