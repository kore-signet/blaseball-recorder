from discord.ext import commands
import discord
import typing
import os
import logging
import sys
import traceback

logging.basicConfig(filename='./archiver.log',level=logging.DEBUG)
bot = commands.Bot(command_prefix=os.environ.get('TOKEN'))

class HelpCog(commands.Cog):
    @commands.command()
    async def help(self,ctx, *, command: typing.Optional[str]):
        h = f"""
    👁️ |        **{ctx.prefix}watch** [minutes to record for]
    👁️ |        **{ctx.prefix}status** [get current recording status]
        """

        about = """
        *by allie ([cat-girl.gay](https://cat-girl.gay) | sapphicfettucine#6248)*
        """

        embed = discord.Embed(title="**archiver help**", description=h + about)
        await ctx.send(embed=embed)

class Archiver(commands.Bot):
    def __init__(self,**kwargs):
        self.config = {
            'ARCHIVER_PATH': os.environ.get('ARCHIVER_PATH','node/preserve.js'),
            'TOKEN': os.environ.get('TOKEN'),
            'PREFIX': os.environ.get('DISCORD_PREFIX','eyes:'),
            'DEFAULT_TIME_LIMIT': int(os.environ.get('DEFAULT_TIME_LIMIT','20')),
            'time_limits': {}
        }

        for limit in os.environ.get('TIME_LIMITS','').split(','):
            split = limit.split(':')
            self.config['time_limits'][int(split[0])] = int(split[1])

        super().__init__(command_prefix=self.config['PREFIX'],help_command=None)
        self.load_extension('clockwork.video')
        self.add_cog(HelpCog())

    async def close(self):
        await self.get_cog('VideoCog').interrupt()
        await super().close()

    async def on_command_error(self, ctx, error):
        traceback.print_exception(type(error), error, error.__traceback__, file='./err.log')

bot = Archiver()
bot.run(bot.config['TOKEN'])
