---
title: Client Implementation Settings
---

Client setting implementations provide concrete runtime behavior over the setting interfaces.

Revgrid includes three implementation families:

1. Default: baseline values and computed defaults.
1. In-memory: mutable runtime settings suitable for interactive apps.
1. Readonly: immutable wrappers for controlled environments.

These implementations centralize merge/override behavior so client code and libraries can share the same setting semantics.
