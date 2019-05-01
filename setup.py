from setuptools import setup

setup(
   name="bitgov",
   version="0.1.3",
   author="Jacob Philpott",
   author_email="jacob.philpott@gmx.com",
   url="https://github.com/jgphilpott/bitgov",
   description="An application layer protocol for the establishment of decentralized democracy.",
   long_description=open("README.md").read(),
   long_description_content_type='text/markdown',
   license="MIT",
   packages=["bitgov", "bitgov.protocol"]
)
