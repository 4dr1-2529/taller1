import pathlib
p = pathlib.Path("frontend/src/components/ui/FormField.tsx")
t = p.read_text(encoding="utf-8")
bad = "{children}</" + "motion.div>"
good = "{children}</motion.div>"
# fix mistaken motion closing on div open
t = t.replace(bad, "{children}</div>")
p.write_text(t, encoding="utf-8")
print("done")
