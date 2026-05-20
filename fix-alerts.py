wrong = "</" + "motion.div>"
right = "</div>"

for path in [
    "frontend/src/components/views/AlertsView.tsx",
    "frontend/src/components/views/CoursesView.tsx",
]:
    t = open(path, encoding="utf-8").read()
    if "AlertsView" in path and ", useState" not in t[:400]:
        t = t.replace(
            'import { useCallback, useEffect, useMemo } from "react";',
            'import { useCallback, useEffect, useMemo, useState } from "react";',
        )
    n = t.count(wrong)
    t = t.replace(wrong, right)
    open(path, "w", encoding="utf-8").write(t)
    print(path, n)
