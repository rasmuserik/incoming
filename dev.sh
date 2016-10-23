while inotifywait -e modify,close_write,move_self -q *.js
do 
  kill `cat .pid`
  sleep 0.1
  node incoming.js $@ &
  echo $! > .pid
  sleep 3
done
