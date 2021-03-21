from discord.ext import commands
import discord
from datetime import datetime, timedelta
import subprocess
import typing
import zmq
import zmq.asyncio
import humanize
import logging
import functools

class VideoCog(commands.Cog):
    def __init__(self,config):
        self.config = config
        self.sock = None
        self.zctx = zmq.asyncio.Context()
        self.running = False
        self.started_time = None
        self.archiving_until = None

    @commands.command(brief="archives blaseball as video",
    help="Archives blaseball as video.\n ex: eyes:watch 30",
    usage="[time to archive for, as minutes]")
    async def watch(self,ctx,minutes: int):
        if self.running:
            embed=discord.Embed(title="Currently archiving", description="i am Watching 👀")
            embed.add_field(name="Started at (UTC)", value=self.started_time.strftime('%d/%m %H:%M'), inline=False)
            remaining = self.archiving_until - datetime.now()
            if remaining > timedelta(0):
                embed.add_field(name="Remaining time", value=humanize.naturaldelta(self.archiving_until - datetime.now(),minimum_unit="seconds"), inline=False)
            else:
                embed.add_field(name="Finishing up..",value="i'm finishing up the archival of the current clip. i'll be done in a few moments!")
            await ctx.send(embed=embed)
            return

        limits = []
        limit = None
        for r in ctx.author.roles:
            if self.config['time_limits'].get(r.id,None):
                limits.append(self.config['time_limits'][r.id])

        if limits:
            limits = sorted(limits)
            limit = limits[0]
        else:
            limit = self.config['DEFAULT_TIME_LIMIT']

        if limit != -1 and minutes > limit:
            await ctx.send("hey, that amount of recording time is over the time limit >:")
            return

        minutes = 60 * (minutes + 5)

        logging.debug("Binding")
        self.sock = self.zctx.socket(zmq.PAIR)
        self.sock.setsockopt(zmq.RCVTIMEO, -1)
        self.sock.bind('ipc://blaseball-archiver')

        logging.debug("starting")
        subprocess.Popen(["/usr/bin/node",self.config['ARCHIVER_PATH'],str(minutes)])

        logging.debug("one")
        m = await self.sock.recv_string()
        assert m == "CREATED INPUT"

        logging.debug("two")
        m = await self.sock.recv_string()
        assert m == "CREATED OUTPUT"

        logging.debug("three")
        m = await self.sock.recv_string()
        assert m == "RUNNING"

        logging.debug("ok")
        m = await self.sock.recv_string()
        self.running = True

        self.started_time = datetime.fromtimestamp(int(m.split(':')[1]) / 1000)
        self.archiving_until = self.started_time + timedelta(seconds=minutes-(60*5))


        await ctx.send(f"okay! started archiving until {self.archiving_until.strftime('%d/%m %H:%M')}")

        f = await self.sock.recv_string()
        logging.debug("i'm done")
        self.sock.close()
        self.running = False
        self.started_time = None

    @commands.command(brief="shows current archiving status")
    async def status(self,ctx):
        if self.running:
            embed=discord.Embed(title="Currently archiving", description="i am Watching 👀")
            embed.add_field(name="Started at (UTC)", value=self.started_time.strftime('%d/%m %H:%M'), inline=False)
            remaining = self.archiving_until - datetime.now()
            if remaining > timedelta(0):
                embed.add_field(name="Remaining time", value=humanize.naturaldelta(self.archiving_until - datetime.now(),minimum_unit="seconds"), inline=False)
            else:
                embed.add_field(name="Finishing up..",value="i'm finishing up the archival of the current clip. i'll be done in a few moments!")

            await ctx.send(embed=embed)
        else:
            await ctx.send("i'm not currently archiving blaseball.")

    async def interrupt(self):
        if self.running:
            await self.sock.send("INTERRUPT")
            m = await self.sock.recv_string()
            assert "DONE" in m

            self.sock.close()

            self.running = False
            self.started_time = None


def setup(bot):
    bot.add_cog(VideoCog(bot.config))
