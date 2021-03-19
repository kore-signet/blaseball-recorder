from discord.ext import commands
from datetime import datetime, timedelta
import subprocess
import humanize
import logging

logging.basicConfig(level=logging.DEBUG)

bot = commands.Bot(command_prefix='eyes:')
bot.archiving = False

@bot.command(brief="archives blaseball as video",help="Archives blaseball as video.\n ex: eyes:watch 30",usage="[time to archive for, as minutes]")
async def watch(ctx,time: int):
#    if time > 35:
#        await ctx.send("the max amount of time i can archive is 35 minutes ):")
#        return
    if bot.archiving:
        await ctx.send(f"i'm already archiving blaseball until {humanize.naturaldelta(bot.archiving_until - datetime.now(),minimum_unit='seconds')} from now")
    time = time * 60
    subprocess.Popen(["/usr/bin/node","preserve.js",str(time)])
    bot.archiving = True
    bot.archiving_until = datetime.now() + timedelta(seconds=time)
    await ctx.send(f"alright! archiving until {humanize.naturaldelta(bot.archiving_until - datetime.now(),minimum_unit='seconds')} from now")

@bot.command(brief="shows current archiving status")
async def status(ctx):
    if bot.archiving_until < datetime.now():
        bot.archiving = False
    if bot.archiving:
        await ctx.send(f"i'm archiving blaseball as video until {humanize.naturaldelta(bot.archiving_until - datetime.now())} from now")
    else:
        await ctx.send("i'm not archiving right now!")

bot.run('ODIyNTM0NTg5ODY4MDE1NjQ3.YFTrCA.ez_Z2jEoFpMfNRZ0mzedlpF91iA')
