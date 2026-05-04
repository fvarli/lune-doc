"""PDF / image processing engines.

Each module exposes a small framework-free function that takes Paths
(or bytes) and returns Paths (or bytes). Workers wire these into the
File/Job lifecycle; routes never touch the engines directly.
"""
