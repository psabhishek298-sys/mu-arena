@echo off
echo Initializing Git repository...
git init

echo Adding files...
git add .

echo Configuring Git identity...
git config user.email "admin@mu-arena.com"
git config user.name "MU Arena Admin"

echo Committing changes...
git commit -m "Initial commit for MU Arena Registration & Leaderboard"

echo Setting main branch...
git branch -M main

echo Adding remote repository...
git remote remove origin
git remote add origin git@github.com:psabhishek298-sys/mu-arena.git

echo Pushing to GitHub via SSH...
git push -u origin main

echo.
echo If it asked for a login, please complete it. If you see an error about the remote existing, that's okay.
pause
